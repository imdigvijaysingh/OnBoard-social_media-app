import { useState } from "react";

const PrivacyModal = ({
  isLogin = false,
  isOpen = false,
  onClose,
  onAccept,
  viewingDocument: externalViewingDoc,
  setViewingDocument: externalSetViewingDoc,
}) => {
  const [internalViewingDoc, setInternalViewingDoc] = useState(null);

  // Support controlled or uncontrolled document viewing
  const viewingDocument =
    externalViewingDoc !== undefined ? externalViewingDoc : internalViewingDoc;
  const setViewingDoc = externalSetViewingDoc || setInternalViewingDoc;

  // When a user is on the login page and not actively inspecting terms, render nothing.
  // Existing users already accepted the terms during account creation.
  if (isLogin && !viewingDocument) {
    return null;
  }

  // If overlay is not open and no document is being viewed, render nothing.
  if (!isOpen && !viewingDocument) {
    return null;
  }

  const handleAcceptClick = () => {
    localStorage.setItem("ob_privacy_accepted", "true");
    if (onAccept) {
      onAccept();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* ── FULL DOCUMENT VIEWER OVERLAY ── */}
      {viewingDocument && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {viewingDocument === "terms" ? "Terms & Conditions" : "Privacy Policy"}
              </h2>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close document"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 text-gray-600 space-y-4 text-sm leading-relaxed">
              {viewingDocument === "terms" ? (
                <>
                  <p className="font-semibold text-gray-900 text-base">1. Introduction</p>
                  <p>Welcome to OnBoard. By accessing our app, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service.</p>
                  
                  <p className="font-semibold text-gray-900 text-base mt-6">2. User Accounts</p>
                  <p>When you create an account, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                  
                  <p className="font-semibold text-gray-900 text-base mt-6">3. Content and Intellectual Property</p>
                  <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are entirely responsible for the Content that you post. The Service and its original content, features and functionality are and will remain the exclusive property of OnBoard and its licensors.</p>
                  
                  <p className="font-semibold text-gray-900 text-base mt-6">4. Termination</p>
                  <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900 text-base">1. Information Collection</p>
                  <p>We collect several different types of information for various purposes to provide and improve our Service to you. This includes Personal Data such as Email address, First name and last name, and Cookies and Usage Data.</p>
                  
                  <p className="font-semibold text-gray-900 text-base mt-6">2. Use of Data</p>
                  <p>OnBoard uses the collected data for various purposes: to provide and maintain the Service, to notify you about changes to our Service, to allow you to participate in interactive features, and to provide customer care and support.</p>
                  
                  <p className="font-semibold text-gray-900 text-base mt-6">3. Transfer of Data</p>
                  <p>Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.</p>
                  
                  <p className="font-semibold text-gray-900 text-base mt-6">4. Security of Data</p>
                  <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TERMS & CONDITIONS REQUIRED OVERLAY ── */}
      {isOpen && !isLogin && !viewingDocument && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {/* Top Icon Badge */}
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3.5 shadow-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Terms & Conditions
            </h3>

            {/* Small text requested by the user */}
            <p className="text-xs text-gray-500 mb-5 leading-relaxed px-2">
              You need to accept the terms and conditions first to create your account.
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                type="button"
                onClick={handleAcceptClick}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                Accept & Continue
              </button>

              <div className="flex items-center justify-center gap-3 text-xs text-gray-500 pt-1">
                <button
                  type="button"
                  onClick={() => setViewingDoc("terms")}
                  className="text-indigo-600 hover:underline font-medium cursor-pointer"
                >
                  Read Terms
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setViewingDoc("privacy")}
                  className="text-indigo-600 hover:underline font-medium cursor-pointer"
                >
                  Read Privacy Policy
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrivacyModal;
