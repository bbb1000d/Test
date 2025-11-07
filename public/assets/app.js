const app = document.querySelector('#app');

const funPrompts = [
  'Sketch a mind-map of today\'s topic with at least 5 branches.',
  'Record a 60-second voice note teaching the concept to a younger student.',
  'Design a flash quiz with 3 curveball questions to test your memory.',
  'Pair your notes with a soundtrack: what song keeps you focused right now?',
  'Summarize the topic using emojis only, then translate it back to real words.',
];

let funPromptIndex = 0;
let uiDraftAttachments = [];
let appState = null;

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function refreshState() {
  const data = await fetchJSON('/api/state', { method: 'GET' });
  appState = data;
  render();
}

function el(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== undefined && value !== null) {
      element.setAttribute(key, value);
    }
  });
  children.flat().forEach((child) => {
    if (child === null || child === undefined) return;
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  return element;
}

function handleError(error) {
  console.error(error);
  window.alert(error.message || 'Something went wrong.');
}

function renderProfileCard() {
  const section = el('section', { className: 'card profile-card' });
  section.appendChild(el('h2', {}, 'Profile'));
  section.appendChild(
    el('p', { className: 'description' }, 'Create your learning profile, sign in, and keep it updated so the AI plan can adapt to you.')
  );

  if (!appState.profile) {
    const form = el('form');

    const fields = [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'studyHabits', label: 'Study habits', type: 'textarea' },
      { name: 'difficulties', label: 'Difficulties', type: 'textarea' },
      { name: 'biography', label: 'Learning biography', type: 'textarea' },
      { name: 'languagePreference', label: 'Preferred language', type: 'text' },
    ];

    fields.forEach((field) => {
      const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      input.name = field.name;
      if (field.type !== 'textarea') {
        input.type = field.type;
      }
      if (field.required) {
        input.required = true;
      }
      form.appendChild(
        el('label', {}, field.label, input)
      );
    });

    form.appendChild(el('button', { type: 'submit' }, 'Create profile'));
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      try {
        await fetchJSON('/api/profile/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });

    section.appendChild(form);
    return section;
  }

  if (!appState.authenticated) {
    const signInForm = el('form');
    const email = el('input', { name: 'email', type: 'email', required: true });
    const password = el('input', { name: 'password', type: 'password', required: true });
    signInForm.appendChild(el('label', {}, 'Email', email));
    signInForm.appendChild(el('label', {}, 'Password', password));
    signInForm.appendChild(el('button', { type: 'submit' }, 'Sign in'));

    signInForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await fetchJSON('/api/profile/sign-in', {
          method: 'POST',
          body: JSON.stringify({ email: email.value, password: password.value }),
        });
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });

    section.appendChild(el('div', { className: 'muted' }, 'Welcome back! Sign in to continue where you left off.'));
    section.appendChild(signInForm);
    return section;
  }

  const profile = appState.profile;
  const info = el('div', { className: 'profile-info' });
  info.appendChild(el('div', {}, el('strong', {}, profile.name)));
  info.appendChild(el('div', { className: 'muted' }, profile.email));
  info.appendChild(el('p', {}, profile.biography || 'No biography added yet.'));
  info.appendChild(
    el('div', { className: 'muted' }, `Preferred language: ${profile.languagePreference || 'English'}`)
  );

  const habits = profile.studyHabits ? el('p', {}, `Habits: ${profile.studyHabits}`) : null;
  const difficulties = profile.difficulties ? el('p', {}, `Difficulties: ${profile.difficulties}`) : null;
  [habits, difficulties].forEach((entry) => entry && info.appendChild(entry));

  const buttons = el('div', { style: 'display:flex; gap:12px; flex-wrap: wrap;' });
  const signOut = el('button', { className: 'secondary', type: 'button' }, 'Sign out');
  signOut.addEventListener('click', async () => {
    try {
      await fetchJSON('/api/profile/sign-out', { method: 'POST', body: JSON.stringify({}) });
      await refreshState();
    } catch (error) {
      handleError(error);
    }
  });

  const editButton = el('button', { type: 'button' }, 'Update profile');
  buttons.appendChild(editButton);
  buttons.appendChild(signOut);

  const updateForm = el('form', { style: 'display:none;' });
  const fields = {
    name: profile.name,
    email: profile.email,
    password: profile.password,
    studyHabits: profile.studyHabits,
    difficulties: profile.difficulties,
    biography: profile.biography,
    languagePreference: profile.languagePreference,
  };
  Object.entries(fields).forEach(([name, value]) => {
    const isLong = name === 'studyHabits' || name === 'difficulties' || name === 'biography';
    const input = isLong ? document.createElement('textarea') : document.createElement('input');
    input.name = name;
    if (!isLong) {
      input.type = name === 'password' ? 'password' : 'text';
    }
    input.value = value || '';
    updateForm.appendChild(el('label', {}, name.replace(/([A-Z])/g, ' $1'), input));
  });
  updateForm.appendChild(el('button', { type: 'submit' }, 'Save changes'));
  updateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(updateForm).entries());
    try {
      await fetchJSON('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await refreshState();
    } catch (error) {
      handleError(error);
    }
  });

  editButton.addEventListener('click', () => {
    const visible = updateForm.style.display === 'grid';
    updateForm.style.display = visible ? 'none' : 'grid';
  });

  section.appendChild(info);
  section.appendChild(buttons);
  section.appendChild(updateForm);
  return section;
}

function renderProgressCard() {
  const section = el('section', { className: 'card progress-card' });
  section.appendChild(el('h2', {}, 'Progress overview'));
  section.appendChild(
    el('p', { className: 'description' }, 'Track how many tasks are complete and launch your personalised learning path.')
  );

  const tasks = appState.tasks || [];
  const completed = tasks.filter((task) => task.done).length;
  const ratio = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  section.appendChild(
    el(
      'div',
      {},
      el('div', { className: 'progress-bar' }, el('span', { style: `width:${ratio}%` })),
      el('p', { className: 'muted' }, `${completed} of ${tasks.length || 0} tasks completed`)
    )
  );

  if (appState.authenticated && !appState.started) {
    const button = el('button', { type: 'button' }, 'Get started');
    button.addEventListener('click', async () => {
      try {
        await fetchJSON('/api/started', { method: 'POST', body: JSON.stringify({}) });
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });
    section.appendChild(button);
  }

  return section;
}

function renderPlannerCard() {
  const section = el('section', { className: 'card planner-card' });
  section.appendChild(el('h2', {}, 'Planner and to-do'));
  section.appendChild(
    el('p', { className: 'description' }, 'Mark tasks as complete and schedule new habits to keep momentum going.')
  );

  const list = el('ul', { className: 'task-list' });
  (appState.tasks || []).forEach((task) => {
    const item = el('li', { className: task.done ? 'completed' : '' });
    const text = el('span', {}, task.label);
    const due = task.dueDate ? el('span', { className: 'muted' }, `Due ${task.dueDate}`) : null;
    const toggle = el('button', { type: 'button', className: 'secondary' }, task.done ? 'Undo' : 'Mark done');
    toggle.addEventListener('click', async () => {
      try {
        await fetchJSON(`/api/tasks/toggle/${task.id}`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });
    item.appendChild(el('div', {}, text, due));
    item.appendChild(toggle);
    list.appendChild(item);
  });

  section.appendChild(list);

  if (appState.authenticated) {
    const form = el('form');
    const labelInput = el('input', { name: 'label', type: 'text', required: true, placeholder: 'Add a new task' });
    const dueInput = el('input', { name: 'dueDate', type: 'date' });
    const doneInput = el('select', { name: 'done' });
    doneInput.appendChild(el('option', { value: 'false' }, 'To do'));
    doneInput.appendChild(el('option', { value: 'true' }, 'Completed'));
    form.appendChild(el('label', {}, 'Task', labelInput));
    form.appendChild(el('label', {}, 'Due date', dueInput));
    form.appendChild(el('label', {}, 'Status', doneInput));
    form.appendChild(el('button', { type: 'submit' }, 'Add task'));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.done = payload.done === 'true';
      try {
        await fetchJSON('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        form.reset();
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });

    section.appendChild(form);
  }

  return section;
}

function renderCalendarCard() {
  const section = el('section', { className: 'card calendar-card' });
  section.appendChild(el('h2', {}, 'Study calendar'));
  section.appendChild(
    el('p', { className: 'description' }, 'Stay aware of focus blocks, review sessions, and assessments coming up.')
  );

  const calendar = el('div', { className: 'calendar' });
  (appState.events || []).forEach((event) => {
    const badgeClass = `badge ${event.type}`;
    calendar.appendChild(
      el(
        'div',
        { className: 'calendar-item' },
        el('div', {}, event.title),
        el('div', { className: 'muted' }, event.date),
        el('span', { className: badgeClass }, event.type)
      )
    );
  });

  section.appendChild(calendar);
  return section;
}

function renderHistoryCard() {
  const section = el('section', { className: 'card history-card' });
  section.appendChild(el('h2', {}, 'Past studies & tests'));
  section.appendChild(
    el('p', { className: 'description' }, 'Your latest study logs and upcoming tests stay here for easy reference.')
  );

  const studyList = el('div', { style: 'display:grid; gap:12px;' });
  (appState.pastStudies || []).slice(0, 4).forEach((study) => {
    studyList.appendChild(
      el(
        'div',
        { className: 'calendar-item' },
        el('strong', {}, study.title),
        el('span', { className: 'muted' }, study.date),
        el('p', {}, study.summary),
        el(
          'ul',
          { className: 'tag-group' },
          study.tags.map((tag) => el('li', {}, tag))
        )
      )
    );
  });

  const testsList = el('div', { style: 'display:grid; gap:12px;' });
  (appState.tests || []).slice(0, 4).forEach((test) => {
    testsList.appendChild(
      el(
        'div',
        { className: 'calendar-item' },
        el('strong', {}, test.title),
        el('span', { className: 'muted' }, test.date),
        el('span', { className: 'badge assessment' }, test.status)
      )
    );
  });

  section.appendChild(el('div', { style: 'display:grid; gap:16px;' }, studyList, testsList));
  return section;
}

function renderFunCard() {
  const section = el('section', { className: 'card fun-card' });
  section.appendChild(el('h2', {}, 'Interactive spark'));
  section.appendChild(
    el('p', { className: 'description' }, 'Shake up your routine with playful prompts that keep learning fresh.')
  );

  const panel = el('div', { className: 'fun-panel' });
  const promptText = el('div', {}, funPrompts[funPromptIndex]);
  const button = el('button', { type: 'button' }, 'Give me another idea');
  button.addEventListener('click', () => {
    funPromptIndex = (funPromptIndex + 1) % funPrompts.length;
    promptText.textContent = funPrompts[funPromptIndex];
  });
  panel.appendChild(promptText);
  panel.appendChild(button);
  section.appendChild(panel);
  return section;
}

function renderPlanCard() {
  const section = el('section', { className: 'card plan-card' });
  section.appendChild(el('h2', {}, 'AI study plan'));
  section.appendChild(
    el('p', { className: 'description' }, 'Let the AI craft a targeted plan based on your goal, language, and resources. Track your progress through steps and quizzes.')
  );

  if (!appState.authenticated) {
    section.appendChild(el('div', { className: 'muted' }, 'Sign in to generate and manage AI study plans.'));
    return section;
  }

  if (!appState.activePlan) {
    const form = el('form');
    const topicInput = el('input', { name: 'topic', type: 'text', placeholder: 'Organic chemistry, world history, ...', required: true });
    const languageInput = el('input', { name: 'language', type: 'text', value: appState.profile?.languagePreference || 'English' });
    const targetSelect = el('select', { name: 'target' });
    ['Test', 'Essay', 'Revision', 'Project', 'Presentation'].forEach((option) => {
      targetSelect.appendChild(el('option', { value: option }, option));
    });
    const purposeInput = el('textarea', { name: 'outcomeDetail', placeholder: 'Tell the AI what success looks like to you...' });

    const attachmentsContainer = el('div', { className: 'attachments' });
    const attachmentName = el('input', { type: 'text', placeholder: 'Attachment name' });
    const attachmentKind = el('select');
    ['notes', 'pdf', 'slides', 'image', 'audio'].forEach((kind) => {
      attachmentKind.appendChild(el('option', { value: kind }, kind));
    });
    const addAttachmentButton = el('button', { type: 'button', className: 'secondary' }, 'Add resource');

    function refreshAttachmentList() {
      attachmentsContainer.innerHTML = '';
      if (!uiDraftAttachments.length) {
        attachmentsContainer.appendChild(el('div', { className: 'muted' }, 'No resources added yet.'));
        return;
      }
      uiDraftAttachments.forEach((item, index) => {
        const row = el('div', {}, `${item.name} · ${item.kind}`);
        const remove = el('button', { type: 'button', className: 'secondary' }, 'Remove');
        remove.addEventListener('click', () => {
          uiDraftAttachments.splice(index, 1);
          refreshAttachmentList();
        });
        const wrapper = el('div', { style: 'display:flex; justify-content:space-between; gap:12px;' }, row, remove);
        attachmentsContainer.appendChild(wrapper);
      });
    }

    refreshAttachmentList();

    addAttachmentButton.addEventListener('click', () => {
      if (!attachmentName.value.trim()) {
        handleError(new Error('Please provide a name for the resource.'));
        return;
      }
      uiDraftAttachments.push({ name: attachmentName.value.trim(), kind: attachmentKind.value });
      attachmentName.value = '';
      refreshAttachmentList();
    });

    form.appendChild(el('label', {}, 'Topic', topicInput));
    form.appendChild(el('label', {}, 'Language', languageInput));
    form.appendChild(el('label', {}, 'Target outcome', targetSelect));
    form.appendChild(el('label', {}, 'Tell the AI more', purposeInput));
    form.appendChild(el('label', {}, 'Resources to include', attachmentsContainer));
    form.appendChild(addAttachmentButton);
    form.appendChild(el('button', { type: 'submit' }, 'Generate study plan'));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        topic: topicInput.value,
        language: languageInput.value,
        target: targetSelect.value,
        outcomeDetail: purposeInput.value,
        attachments: uiDraftAttachments,
      };
      try {
        await fetchJSON('/api/plan', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        uiDraftAttachments = [];
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });

    section.appendChild(form);
    return section;
  }

  const plan = appState.activePlan;
  section.appendChild(el('div', { className: 'muted' }, `Started ${new Date(plan.createdAt).toLocaleString()}`));
  section.appendChild(el('strong', {}, `${plan.topic} · ${plan.target}`));
  section.appendChild(el('div', {}, `Language: ${plan.language}`));

  if (plan.attachments?.length) {
    const attachments = el('div', { className: 'attachments' });
    plan.attachments.forEach((attachment) => {
      attachments.appendChild(el('div', {}, `${attachment.name}`, el('span', { className: 'badge' }, attachment.kind)));
    });
    section.appendChild(attachments);
  }

  const stepsList = el('ul', { className: 'plan-steps' });
  plan.steps.forEach((step) => {
    const completed = plan.completedSteps.includes(step.id);
    const item = el('li', { className: completed ? 'completed' : '' });
    item.appendChild(el('strong', {}, step.title));
    item.appendChild(el('div', { className: 'muted' }, `${step.duration} · ${step.kind}`));
    item.appendChild(el('p', {}, step.focus));
    const button = el('button', { type: 'button', className: 'secondary' }, completed ? 'Mark as pending' : 'Mark complete');
    button.addEventListener('click', async () => {
      try {
        await fetchJSON(`/api/plan/steps/${step.id}`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });
    item.appendChild(button);
    stepsList.appendChild(item);
  });
  section.appendChild(el('h3', {}, 'Learning steps'));
  section.appendChild(stepsList);

  const quizList = el('ul', { className: 'quiz-list' });
  plan.quizzes.forEach((quiz) => {
    const completed = plan.completedQuizzes.includes(quiz.id);
    const item = el('li', { className: completed ? 'completed' : '' });
    item.appendChild(el('strong', {}, quiz.title));
    item.appendChild(el('p', {}, quiz.question));
    if (quiz.options) {
      item.appendChild(el('div', { className: 'muted' }, `Options: ${quiz.options.join(', ')}`));
    }
    const button = el('button', { type: 'button', className: 'secondary' }, completed ? 'Mark as pending' : 'Mark complete');
    button.addEventListener('click', async () => {
      try {
        await fetchJSON(`/api/plan/quizzes/${quiz.id}`, {
          method: 'POST',
          body: JSON.stringify({})
        });
        await refreshState();
      } catch (error) {
        handleError(error);
      }
    });
    item.appendChild(button);
    quizList.appendChild(item);
  });
  section.appendChild(el('h3', {}, 'Interactive quizzes'));
  section.appendChild(quizList);

  section.appendChild(
    el('div', { className: 'fun-panel' },
      el('strong', {}, 'Final exam practice'),
      el('p', {}, plan.exam.question),
      el('span', { className: 'muted' }, 'Write your answer in your notes and mark the quiz when you feel ready.')
    )
  );

  return section;
}

function render() {
  if (!appState) {
    return;
  }
  app.innerHTML = '';
  app.appendChild(renderProfileCard());
  app.appendChild(renderProgressCard());
  app.appendChild(renderPlannerCard());
  app.appendChild(renderCalendarCard());
  app.appendChild(renderHistoryCard());
  app.appendChild(renderPlanCard());
  app.appendChild(renderFunCard());
}

refreshState().catch(handleError);
