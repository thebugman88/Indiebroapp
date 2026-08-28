import React from 'react';
import { X, HelpCircle, Shield, FileText, CheckCircle, Users, Vote, Layers, Clock } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div id="help-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="help-modal-content" className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Meeting Room Guide & Help</h2>
          </div>
          <button
            id="close-help-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm leading-relaxed">
          <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-blue-600" /> Overview & Roles
            </h3>
            <p className="mt-1 text-slate-600">
              The platform supports two distinct participation modes:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                <span className="font-semibold text-slate-900 block">Host / Moderator</span>
                <span className="text-xs text-slate-600 mt-1 block">
                  Opens the main dialog to put up new agenda topics, initiates and concludes Ya/Na voting motions, manages speaker hands, and oversees quorum.
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                <span className="font-semibold text-slate-900 block">Attendee / Voter</span>
                <span className="text-xs text-slate-600 mt-1 block">
                  Attends the meeting in real-time, reviews current topics, casts Ya (Yes) or Na (No) on active proposals, raises hand to speak, and submits chat questions.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Vote className="w-4 h-4 text-emerald-600" /> Voting Protocol (Ya or Na)
            </h4>
            <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
              <li>When the Host puts up a motion, the live voting dialog activates for all connected attendees.</li>
              <li>Attendees can select <strong>Ya</strong> (in favor), <strong>Na</strong> (opposed), or <strong>Abstain</strong>.</li>
              <li>Live tallied progress bars update dynamically on every connected screen via WebSocket.</li>
              <li>The host may set an optional countdown timer or manually conclude the vote to evaluate the required threshold (Simple Majority, Two-Thirds, or Unanimous).</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" /> Topic & Agenda Management
            </h4>
            <p className="text-slate-600">
              Hosts can add topics with title, description, presenter, and status. Topics can be directly transformed into voting motions with a single click.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Minutes & Records
            </h4>
            <p className="text-slate-600">
              All concluded motions, vote breakdowns, and attendance records are logged and can be exported as structured Markdown, Plain Text, or CSV files at any time.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            id="dismiss-help-modal-btn"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function TermsModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div id="terms-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="terms-modal-content" className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Terms of Service</h2>
          </div>
          <button
            id="close-terms-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-slate-700 text-sm leading-relaxed">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">1. Acceptance of Terms</h3>
            <p className="text-slate-600">
              By accessing and participating in this assembly meeting room system, all moderators, attendees, and observers agree to comply with standard meeting conduct rules and these terms.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">2. Meeting Governance & Voting Integrity</h3>
            <p className="text-slate-600">
              Each connected participant is granted single-vote authority per motion unless designated with proxy credentials by the room moderator. Automated voting spam or deliberate session interruption is strictly prohibited.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">3. Moderator Prerogative</h3>
            <p className="text-slate-600">
              The designated host maintains the authority to open agenda topics, initiate voting ballots, manage speaker queues, and archive meeting minutes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">4. Intellectual Property & Brand</h3>
            <p className="text-slate-600">
              Meeting room software architecture and branding © 2026 indiebrotherhood. All rights reserved.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            id="agree-terms-modal-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div id="privacy-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="privacy-modal-content" className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Privacy Policy</h2>
          </div>
          <button
            id="close-privacy-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-slate-700 text-sm leading-relaxed">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">1. Information We Collect</h3>
            <p className="text-slate-600">
              We collect display names provided during entry, attendee role selections, motion votes cast during active ballots, and chat messages submitted within the session room.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">2. Real-Time Data Handling</h3>
            <p className="text-slate-600">
              Room actions and voting statuses are relayed across real-time WebSockets to synchronize attendees. Data is maintained for session continuity and minutes archiving.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">3. Local Storage</h3>
            <p className="text-slate-600">
              Client preferences (such as your chosen display name, avatar accent color, and recently attended room IDs) are stored locally in your browser’s localStorage.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">4. Contact & Compliance</h3>
            <p className="text-slate-600">
              For governance inquiries and meeting record requests, please consult the room administrator. Sponsored and provided by 2026 indiebrotherhood.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            id="acknowledge-privacy-modal-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
