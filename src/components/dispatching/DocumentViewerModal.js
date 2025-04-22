'use client';

import React from 'react';
import { Dialog, Transition } from '@headlessui/react';import { XMarkIcon, DocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import SupabaseImage from '../fuel/SupabaseImage'; // Assuming SupabaseImage can handle storage URLs

// Helper to check if a URL points to an image
const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
};

// Helper to check if a URL points to a PDF
const isPdfUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.pdf$/i.test(url);
};

export default function DocumentViewerModal({ isOpen, onClose, documents, loadNumber }) {
  if (!isOpen) return null;

  // Ensure documents is an array, even if null or undefined is passed
  const docList = Array.isArray(documents) ? documents : [];

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Documents for Load {loadNumber || 'N/A'}
                </Dialog.Title>
                
                <div className="mt-2 max-h-[60vh] overflow-y-auto">
                  {docList.length > 0 ? (
                    <ul className="space-y-4">
                      {docList.map((doc, index) => (
                        <li key={index} className="border p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-700 mb-2">Document {index + 1}</p>
                          {isImageUrl(doc.url) ? (
                            // Use SupabaseImage for potential optimizations if paths are relative
                            // If doc.url is a full URL, SupabaseImage might need adjustment or use <img>
                            <SupabaseImage 
                              src={doc.url} 
                              alt={`Document ${index + 1}`} 
                              className="w-full h-auto object-contain max-h-96 rounded" 
                              isPublicUrl={true} // Assuming the URL is publicly accessible or SupabaseImage handles signed URLs
                            />
                          ) : isPdfUrl(doc.url) ? (
                             <div className="mt-2">
                               <a 
                                 href={doc.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                               >
                                 View PDF Document {index + 1}
                               </a>
                             </div>
                          ) : (
                             <div className="mt-2">
                               <a 
                                 href={doc.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                               >
                                 View Document {index + 1} (Unknown Type)
                               </a>
                               <p className="text-xs text-gray-500 mt-1">Filename: {doc.name || 'N/A'}</p>
                             </div>
                          )}
                           {/* Display filename if available */}
                           {doc.name && !isPdfUrl(doc.url) && !isImageUrl(doc.url) && (
                             <p className="text-xs text-gray-500 mt-1">Filename: {doc.name}</p>
                           )}
                           {isImageUrl(doc.url) && (
                             <p className="text-xs text-gray-500 mt-1 text-center">
                               <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline">View full size</a>
                             </p>
                           )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500">No documents found for this load.</p>
                  )}
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
