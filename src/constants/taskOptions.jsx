// src/constants/taskOptions.jsx

// 1) Glob in all the JSX files from both folders
const taskDetailsFiles = import.meta.glob(
  '../pages/TaskDetails/Tasks/*.jsx',
  { eager: true }
);
const taskSelectionFiles = import.meta.glob(
  '../pages/TaskSelection/Tasks/*.jsx',
  { eager: true }
);

// 2) Your existing list of legacy tasks
const taskOptions = [
  { label: 'Gait', value: 'Gait' },
  { label: 'Finger Tap Left', value: 'Finger Tap Left' },
  { label: 'Finger Tap Right', value: 'Finger Tap Right' },
  { label: 'Hand Movement Left', value: 'Hand Movement Left' },
  { label: 'Hand Movement Right', value: 'Hand Movement Right' },
  { label: 'Toe tapping Left', value: 'Toe tapping Left' },
  { label: 'Toe tapping Right', value: 'Toe tapping Right' },
  { label: 'Leg agility Left', value: 'Leg agility Left' },
  { label: 'Leg agility Right', value: 'Leg agility Right' },

  // { label: 'Dynamic tremor', value: 'Dynamic tremor' },
  // { label: 'Mouth Opening', value: 'Mouth Opening' },
  // { label: 'Passage', value: 'Passage' },
  // { label: 'Free speech', value: 'Free speech' },
  // { label: 'Hand Tremor', value: 'Hand Tremor' },
  // { label: 'Hand pronation', value: 'Hand pronation' },
  // { label: 'Phonation', value: 'Phonation' },
  // { label: 'Postural tremor', value: 'Postural tremor' },
  // { label: 'DDK', value: 'DDK' },
  // { label: 'Eyebrow elevation', value: 'Eyebrow elevation' },
  // { label: 'Picture Description', value: 'Picture Description' },
  // { label: 'Rest tremor', value: 'Rest tremor' },
  // { label: 'Lips spread', value: 'Lips spread' },
  // { label: 'Arising from chair', value: 'Arising from chair' },
];


const errors = [];
taskOptions.forEach(({ label }) => {
  const fileName = label.toLowerCase().replace(/\s+/g, '_') + '.jsx';
  const hasSelection = Object.keys(taskSelectionFiles).some((p) =>
    p.endsWith(`/Tasks/${fileName}`)
  );
  const hasDetails = Object.keys(taskDetailsFiles).some((p) =>
    p.endsWith(`/Tasks/${fileName}`)
  );

  if (!hasSelection) {
    errors.push(
      `🛑 Startup check failed: missing “${fileName}” in src/pages/TaskSelection/Tasks. Task selection tab is not defined for label: “${label}”.`
    );
  }
  if (!hasDetails) {
    errors.push(
      `🛑 Startup check failed: missing “${fileName}” in src/pages/TaskDetails/Tasks/. Task analysis is not defined for label: “${label}”.`
    );
  }
});

if (errors.length > 0) {
  errors.forEach((msg) => console.error(msg));
  throw new Error(`Startup checks failed with ${errors.length} error(s).`);
}

export { taskOptions };

