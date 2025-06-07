import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { CloudDownload } from '@mui/icons-material';
import Button from '@mui/material/Button';

const FeatureTable = ({ tasks, selectedTaskIndex, fileName }) => {
  const data = tasks[selectedTaskIndex].data;
  data['File name'] = fileName;

  const entries = Object.entries(data).filter(([, value]) =>
    typeof value === 'number' || typeof value === 'string'
  );

  return (
    <div className="overflow-x-auto m-4 rounded-lg shadow-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Feature
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map(([feat, val]) => (
            <tr key={feat}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {feat}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {typeof val === 'number' ? val.toFixed(4) : val}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FeatureTable;