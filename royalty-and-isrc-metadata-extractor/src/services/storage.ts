import { withoutProviderCredentials } from '../../../shared/browserSettings';
import { createPrivateRecords } from '../../../shared/privateRecords';
import { openDB } from 'idb';
import type { Folder, MediaFile, ParsedTrack, AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  ocrEngine: 'tesseract',
  geminiApiKey: '',
  ocrLanguage: 'eng',
  autoPreprocessImage: true,
  enhanceContrast: true,
  binarizeThreshold: false,
  isrcPrefix: '',
  defaultCurrency: 'USD',
  defaultPlatform: 'Spotify',
  autoLookupIsrcOnline: false,
  byokKeys: {
    spotifyClientId: '',
    spotifyClientSecret: '',
    discogsToken: '',
    acoustidApiKey: '',
    auddApiKey: '',
    musoAiApiKey: '',
  },
};



export function createRoyaltyStorage(uid: string, isCurrent: () => boolean, open: typeof openDB = openDB) {
  const records=createPrivateRecords(uid,isCurrent,open);
  const getAllFolders=()=>records.all<Folder>('folders');
  const getAllFiles=()=>records.all<MediaFile>('files');
  const getAllTracks=()=>records.all<ParsedTrack>('tracks');
  const getFileById=(id:string)=>records.get<MediaFile>('files',id);
  const saveFolder=(folder:Folder)=>records.batch([{store:'folders',id:folder.id,value:folder}]);
  const saveFile=(file:MediaFile)=>records.batch([{store:'files',id:file.id,value:file}]);
  const saveTrack=(track:ParsedTrack)=>records.batch([{store:'tracks',id:track.id,value:track}]);
  const saveTracks=(tracks:ParsedTrack[])=>records.batch(tracks.map(value=>({store:'tracks',id:value.id,value})));
  const getTracksByFileId=async(fileId:string)=>(await getAllTracks()).filter(t=>t.fileId===fileId);
  async function deleteFolder(id:string) {
    const [files,tracks]=await Promise.all([getAllFiles(),getAllTracks()]);
    await records.batch([
      {store:'folders',id,remove:true},
      ...files.filter(f=>f.folderId===id).map(f=>({store:'files',id:f.id,value:{...f,folderId:null}})),
      ...tracks.filter(t=>t.folderId===id).map(t=>({store:'tracks',id:t.id,value:{...t,folderId:null}})),
    ]);
  }
  async function deleteFile(id:string) {
    const tracks=await getTracksByFileId(id);
    await records.batch([{store:'files',id,remove:true},...tracks.map(t=>({store:'tracks',id:t.id,remove:true}))]);
  }
  async function deleteTrack(id:string) {
    const track=await records.get<ParsedTrack>('tracks',id);
    const file=track?.fileId?await getFileById(track.fileId):undefined;
    await records.batch([{store:'tracks',id,remove:true},...(file?[{store:'files',id:file.id,value:{...file,trackCount:Math.max(0,(file.trackCount||1)-1)}}]:[])]);
  }
  async function updateFileStatus(id:string,status:MediaFile['status'],progress:number,rawText?:string,errorMessage?:string,trackCount?:number) {
    const file=await getFileById(id);if(!file)return;
    await saveFile({...file,status,ocrProgress:progress,updatedAt:Date.now(),...(rawText!==undefined?{rawOcrText:rawText}:{}),...(errorMessage!==undefined?{errorMessage}:{}),...(trackCount!==undefined?{trackCount}:{})});
  }
  const clearAllData=()=>records.clear(['folders','files','tracks']);
  const getSettings=async()=>withoutProviderCredentials(await records.get<AppSettings>('settings','app_config')||DEFAULT_SETTINGS);
  const saveSettings=(settings:AppSettings)=>records.batch([{store:'settings',id:'app_config',value:withoutProviderCredentials(settings)}]);
  return {getAllFolders,saveFolder,deleteFolder,getAllFiles,getFileById,saveFile,deleteFile,updateFileStatus,getAllTracks,getTracksByFileId,saveTrack,saveTracks,deleteTrack,clearAllData,getSettings,saveSettings};
}
