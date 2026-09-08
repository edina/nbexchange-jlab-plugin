import { HistoryWidget } from './index';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { Notification } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

import { requestAPI } from '../handler';
import { HistoryList } from './history';
jest.mock('../handler', () => ({ requestAPI: jest.fn() }));
jest.mock('@jupyterlab/apputils', () => ({
  Notification: {
    error: jest.fn(),
    info: jest.fn()
  }
}));

/* Tests still to write */
// show_error
// show_info
// ? Can we get rid of the whole `CourseList` class ?
// ? Does history even have a "disabled button" concept ?
// test Actions show_error

const simpleMockedHistoryData = [
  {
    role: { Instructor: 1 },
    user_id: { '13': 1 },
    assignments: [
      {
        assignment_id: 80,
        assignment_code: 'test 123',
        actions: [
          {
            action: 'AssignmentActions.released',
            timestamp: '2022-01-17 15:51:44.809328 UTC',
            path: '/courses/35/assignments/80/release',
            user: '1-kiz'
          },
          {
            action: 'AssignmentActions.fetched',
            timestamp: '2022-01-17 15:51:52.621861 UTC',
            path: '/courses/35/assignments/80/fetch',
            user: '1-kiz'
          },
          {
            action: 'AssignmentActions.submitted',
            timestamp: '2022-01-17 15:53:11.064558 UTC',
            path: '/courses/35/assignments/80/submit',
            user: '1-kiz'
          },
          {
            action: 'AssignmentActions.collected',
            timestamp: '2022-01-17 15:53:18.915705 UTC',
            path: '/courses/35/assignments/80/collect',
            user: '1-kiz'
          },
          {
            action: 'AssignmentActions.feedback_released',
            timestamp: '2022-01-17 15:54:34.539665 UTC',
            path: '/courses/35/assignments/80/release_feedback',
            user: '1-kiz'
          },
          {
            action: 'AssignmentActions.feedback_fetched',
            timestamp: '2022-01-17 15:54:43.010072 UTC',
            path: '/courses/35/assignments/80/fetch_feedback',
            user: '1-kiz'
          }
        ],
        action_summary: {
          released: 1,
          fetched: 1,
          submitted: 1,
          collected: 1,
          feedback_released: 1,
          feedback_fetched: 1
        }
      }
    ],
    isInstructor: true,
    course_id: 35,
    course_code: 'my_course_code',
    course_title: 'My Course Title',
    isCurrent: false
  }
];

describe('HistoryWidget', () => {
  beforeEach(() => {
    // ensure a clean DOM for each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('initializes correctly and loads all-course history', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: null
    });

    // Mock JupyterFrontEnd
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);
    expect(widget.node.querySelector('#history_h2')).not.toBeNull();
    expect(widget.node.querySelector('#history-toolbar')).not.toBeNull();
    expect(widget.node.querySelector('#actions-panel-group')).not.toBeNull();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(requestAPI).toHaveBeenCalledWith('history?course_id=');
  });

  it('shows a loading spinner until the history request completes', async () => {
    let resolveRequest: (value: unknown) => void;
    (requestAPI as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve;
        })
    );

    const widget = new HistoryWidget({} as JupyterFrontEnd);
    const spinner = widget.node.querySelector(
      '#history-loading'
    ) as HTMLElement;
    const refreshButton = widget.node.querySelector(
      '#refresh_history_list'
    ) as HTMLButtonElement;

    expect(spinner.hidden).toBe(false);
    expect(refreshButton.disabled).toBe(true);

    resolveRequest!({ success: true, value: null });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(spinner.hidden).toBe(true);
    expect(refreshButton.disabled).toBe(false);
  });

  it('loads all courses when given the moot course code', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({ success: true, value: null });
    const widget = new HistoryWidget({} as JupyterFrontEnd);
    const historyList = new HistoryList(widget, 'actions-panel-group');

    await historyList.load_list('moot');

    expect(requestAPI).toHaveBeenLastCalledWith('history?course_id=');
  });

  it('emits persistent JupyterLab notifications', () => {
    const widget = new Widget();
    const historyList = new HistoryList(widget, 'actions-panel-group');
    const error = jest.spyOn(Notification, 'error').mockReturnValue('error-id');
    const info = jest.spyOn(Notification, 'info').mockReturnValue('info-id');
    historyList.show_error('Unable to load history');
    historyList.show_info('No history is available');

    expect(error).toHaveBeenCalledWith('Unable to load history', {
      autoClose: false
    });
    expect(info).toHaveBeenCalledWith('No history is available', {
      autoClose: false
    });
  });

  // test load-list gets network error
  it('handles network error when loading history list', async () => {
    (requestAPI as jest.Mock).mockRejectedValue(new Error('Network Error'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const app = {} as JupyterFrontEnd;
    new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(errorSpy).toHaveBeenCalled();

    expect(Notification.error).toHaveBeenCalledWith(
      'Error on GET /history.\nError: Network Error',
      { autoClose: false }
    );
    errorSpy.mockRestore();
  });

  // test load-list with non-json response
  it('handles non-JSON response when loading history list', async () => {
    (requestAPI as jest.Mock).mockResolvedValue('Non-JSON Response');

    const app = {} as JupyterFrontEnd;
    new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(Notification.error).toHaveBeenCalledWith(
      '<p>HistoryList.load_list() failed with string:</p>\n<pre>Non-JSON Response</pre>',
      { autoClose: false }
    );
  });

  // test load-list with error in response
  it('handles error in response when loading history list', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'false',
      value: 'Some error occurred'
    });
    const app = {} as JupyterFrontEnd;
    new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(Notification.error).toHaveBeenCalledWith(
      '<p>HistoryList.load_list() failed with success not true:</p>\n<pre>Some error occurred</pre>',
      { autoClose: false }
    );
  });

  // test load-list with valid data
  it('loads history list successfully with valid data', async () => {
    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: simpleMockedHistoryData
    });
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 10));

    const elems = widget.node.querySelector('.panel-group > details');
    const summary = elems?.querySelector('summary');

    // string as taken from the mocked data above
    expect(summary?.innerHTML).toContain(
      'My Course Title (my_course_code) - 2022-01-17 -&gt; 2022-01-17'
    );
    const action_groups = elems?.querySelectorAll('div.action-group');
    expect(action_groups?.length).toBe(6);

    if (action_groups) {
      const submit_action_group = action_groups[2];
      const submit_buttons = submit_action_group.querySelectorAll('button');
      // Not the current course, so no collect button
      expect(submit_buttons.length).toBe(1);
    }
  });

  it('reports collect and download responses through notifications', async () => {
    const currentCourseData = [
      { ...simpleMockedHistoryData[0], isCurrent: true }
    ];
    (requestAPI as jest.Mock).mockResolvedValue({
      success: true,
      value: currentCourseData
    });
    const widget = new HistoryWidget({} as JupyterFrontEnd);

    await new Promise(resolve => setTimeout(resolve, 0));

    const collectButton = widget.node.querySelector(
      'button[aria-label^="collect for Course"]'
    ) as HTMLButtonElement;
    const downloadButton = widget.node.querySelector(
      'button[aria-label^="download for Course"]'
    ) as HTMLButtonElement;
    (requestAPI as jest.Mock)
      .mockResolvedValueOnce({ success: true, value: 'Submission collected' })
      .mockResolvedValueOnce({ success: true, value: 'Submission downloaded' });

    collectButton.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    downloadButton.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(Notification.info).toHaveBeenNthCalledWith(
      1,
      'Submission collected',
      {
        autoClose: false
      }
    );
    expect(Notification.info).toHaveBeenNthCalledWith(
      2,
      'Submission downloaded',
      {
        autoClose: false
      }
    );
  });

  it('loads history list identifies valid data with no assignments', async () => {
    const mockData = [
      {
        role: { Instructor: 1 },
        user_id: { '13': 1 },
        assignments: [],
        isInstructor: true,
        course_id: 35,
        course_code: 'my_course_code',
        course_title: 'my_course_code'
      }
    ];
    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: mockData
    });
    const app = {} as JupyterFrontEnd;
    new HistoryWidget(app);
    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(Notification.info).toHaveBeenCalledWith(
      'There is no history to show you',
      {
        autoClose: false
      }
    );
  });

  it('loads history list identifies valid data with no assignments for student', async () => {
    const mockData = [{}];
    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: mockData
    });
    const app = {} as JupyterFrontEnd;
    new HistoryWidget(app);
    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(Notification.info).toHaveBeenCalledWith(
      'There is no history to show you',
      {
        autoClose: false
      }
    );
  });

  // test marks the current course correctly
  it('loads history list lists the current course first', async () => {
    // we need (deep) copy to avoid modifying the original mocked data
    const newMockedHistoryData = [
      JSON.parse(JSON.stringify(simpleMockedHistoryData[0])),
      JSON.parse(JSON.stringify(simpleMockedHistoryData[0]))
    ];

    // add isCurrentCourse to the assignment data
    newMockedHistoryData[1]['isCurrent'] = true;
    newMockedHistoryData[1]['course_id'] = 36;
    newMockedHistoryData[1]['course_code'] = 'course_code_2';
    newMockedHistoryData[1]['course_title'] = 'Course Title 2';

    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: newMockedHistoryData
    });
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 1));

    const elems = widget.node.querySelectorAll('.panel-group > details');
    expect(elems?.length).toBe(2);

    let summary = elems[0]?.querySelector('summary');

    // even though the second course is current, it should be prepended to the top
    expect(summary?.innerHTML).toContain(
      'Course Title 2 (course_code_2) - 2022-01-17 -&gt; 2022-01-17 (current course)'
    );
    expect(elems[0]?.classList.toString()).toContain('current_course');
    let action_groups = elems[0].querySelectorAll('div.action-group');
    expect(action_groups?.length).toBe(6);

    if (action_groups) {
      const submit_action_group = action_groups[2];
      const submit_buttons = submit_action_group.querySelectorAll('button');
      // Current course, so includes collect button
      expect(submit_buttons.length).toBe(2);
    }

    summary = elems[1]?.querySelector('summary');
    expect(summary?.innerHTML).toContain(
      'My Course Title (my_course_code) - 2022-01-17 -&gt; 2022-01-17'
    );
    expect(elems[1]?.classList.toString()).not.toContain('current_course');
    action_groups = elems[1].querySelectorAll('div.action-group');
    expect(action_groups?.length).toBe(6);

    if (action_groups) {
      const submit_action_group = action_groups[2];
      const submit_buttons = submit_action_group.querySelectorAll('button');
      // Not the current course, so no collect button
      expect(submit_buttons.length).toBe(1);
    }
  });

  // test load-list doesn't show buttons for students
  it('history list shows no buttons for students', async () => {
    // we need (deep) copy to avoid modifying the original mocked data
    const newMockedHistoryData = [
      JSON.parse(JSON.stringify(simpleMockedHistoryData[0]))
    ];
    newMockedHistoryData[0]['isInstructor'] = false;
    newMockedHistoryData[0]['role'] = { Student: 1 };
    newMockedHistoryData[0]['assignments'][0]['actions'] =
      newMockedHistoryData[0]['assignments'][0]['actions'].filter(
        (action: { action: string }) =>
          action.action !== 'AssignmentActions.feedback_fetched'
      );

    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: newMockedHistoryData
    });
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 10));

    const elems = widget.node.querySelector('.panel-group > details');
    const summary = elems?.querySelector('summary');

    // string as taken from the mocked data above
    expect(summary?.innerHTML).toContain(
      'My Course Title (my_course_code) - 2022-01-17 -&gt; 2022-01-17'
    );
    const action_groups = elems?.querySelectorAll('div.action-group');
    expect(action_groups?.length).toBe(5);
    expect(elems?.textContent).not.toContain('Feedback Fetched');

    if (action_groups) {
      const submit_action_group = action_groups[2];
      const submit_buttons = submit_action_group.querySelectorAll('button');
      // students should see no buttons
      expect(submit_buttons.length).toBe(0);
    }
  });

  it('formats dates correctly', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: null
    });

    // Mock JupyterFrontEnd
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);
    const historyList = new HistoryList(widget, 'actions-panel-group');

    const date = new Date();
    const formattedDate = historyList.formatDate(date);
    expect(formattedDate).toBe(
      date.getFullYear() +
        '-' +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        date.getDate().toString().padStart(2, '0')
    );
  });

  it('emits an error notification', () => {
    const historyList = new HistoryList(new Widget(), 'actions-panel-group');

    historyList.show_error('Test error message');

    expect(Notification.error).toHaveBeenCalledWith('Test error message', {
      autoClose: false
    });
  });

  it('emits an info notification', () => {
    const historyList = new HistoryList(new Widget(), 'actions-panel-group');

    historyList.show_info('Test info message');

    expect(Notification.info).toHaveBeenCalledWith('Test info message', {
      autoClose: false
    });
  });

  it('runs clear_list correctly', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: null
    });

    // Mock JupyterFrontEnd
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);
    const historyList = new HistoryList(widget, 'actions-panel-group');

    const results_panel = widget.node.querySelector(
      '#actions-panel-group'
    ) as HTMLElement;

    // populate the elements
    results_panel.innerHTML = '<p>Some results</p>';

    historyList.clear_list();

    expect(results_panel.innerHTML).toBe('');
  });

  // test load-list with invalid data
  it('handles success but null value', async () => {
    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: null
    });
    const app = {} as JupyterFrontEnd;
    new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(Notification.info).toHaveBeenCalledWith(
      'There is no history available from the Exchange service',
      { autoClose: false }
    );
  });

  // test load-list with invalid data
  it('handles success and present but bad  value', async () => {
    const mockData = [
      {
        role: 'Instructor',
        userId: '13',
        assignments: [],
        Isinstructor: true,
        courseId: 35,
        courseCode: 'my_course_code',
        courseTitle: 'my_course_code'
      }
    ];
    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: mockData
    });
    const app = {} as JupyterFrontEnd;
    new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(Notification.info).toHaveBeenCalledWith(
      'There is no history to show you',
      { autoClose: false }
    );
  });
});
