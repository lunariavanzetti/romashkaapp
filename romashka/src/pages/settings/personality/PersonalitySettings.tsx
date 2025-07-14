import React from 'react';
import { 
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  LanguageIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function PersonalitySettings() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Personality Configuration</h1>
        <p className="text-gray-600 mt-2">
          Configure your AI assistant's personality and communication style
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <SparklesIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personality Configuration</h3>
            <p className="text-gray-600 mb-4">
              Advanced AI personality system is being configured.
            </p>
            <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              Configure Personality
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <UserCircleIcon className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Personality Traits</h3>
          </div>
          <p className="text-gray-600">Define how your AI communicates with customers</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <LanguageIcon className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">Language & Tone</h3>
          </div>
          <p className="text-gray-600">Customize language style and communication tone</p>
        </div>
      </div>
    </div>
  );
}