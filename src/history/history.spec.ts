import { HistoryWidget } from './index';
import { JupyterFrontEnd } from '@jupyterlab/application';

import { requestAPI } from '../handler';
import { HistoryList } from './history';
jest.mock('../handler', () => ({ requestAPI: jest.fn() }));

/* Tests still to write */
// show_error gets widget with missing 'alert-danger' class
// show_info gets widget with missing 'alert-info' class
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

  it('initializes correctly', () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: null
    });

    // Mock JupyterFrontEnd
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);
    expect(widget.node.querySelector('#history_h2')).not.toBeNull();
    expect(widget.node.querySelector('#history-toolbar')).not.toBeNull();
    expect(
      widget.node.querySelector('#baautograde-alert-danger')
    ).not.toBeNull();
    expect(widget.node.querySelector('#baautograde-alert-info')).not.toBeNull();
    expect(widget.node.querySelector('#actions-panel-group')).not.toBeNull();
  });

  // test load-list gets network error
  it('handles network error when loading history list', async () => {
    (requestAPI as jest.Mock).mockRejectedValue(new Error('Network Error'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);

    const error_box = widget.node.querySelector(
      '#baautograde-alert-danger'
    ) as HTMLElement;

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(errorSpy).toHaveBeenCalled();

    expect(error_box.innerHTML).toContain('Error on GET /history');
    errorSpy.mockRestore();
  });

  // test load-list with non-json response
  it('handles non-JSON response when loading history list', async () => {
    (requestAPI as jest.Mock).mockResolvedValue('Non-JSON Response');

    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);

    const error_box = widget.node.querySelector(
      '#baautograde-alert-danger'
    ) as HTMLElement;
    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>HistoryList.load_list() failed with string:</p>\n<pre>Non-JSON Response</pre>'
    );
  });

  // test load-list with error in response
  it('handles error in response when loading history list', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'false',
      value: 'Some error occurred'
    });
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);

    const error_box = widget.node.querySelector(
      '#baautograde-alert-danger'
    ) as HTMLElement;
    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>HistoryList.load_list() failed with success not true:</p>\n<pre>Some error occurred</pre>'
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
    const widget = new HistoryWidget(app);
    const error_box = widget.node.querySelector('.alert-info') as HTMLElement;

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>There is no history to show you</p>'
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
    const widget = new HistoryWidget(app);
    const error_box = widget.node.querySelector('.alert-info') as HTMLElement;

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>There is no history to show you</p>'
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
    expect(action_groups?.length).toBe(6);

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

  it('sets on show_error correctly', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: null
    });

    // Mock JupyterFrontEnd
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);
    const historyList = new HistoryList(widget, 'actions-panel-group');

    const element = widget.node.getElementsByClassName(
      'alert-danger'
    )[0] as HTMLElement;
    expect(element.innerHTML).toBe('');

    historyList.show_error('<p>Test error message</p>');

    expect(element.innerHTML).toBe('<p>Test error message</p>');
  });

  it('sets on show_info correctly', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: null
    });

    // Mock JupyterFrontEnd
    const app = {} as JupyterFrontEnd;
    const widget = new HistoryWidget(app);
    const historyList = new HistoryList(widget, 'actions-panel-group');

    const element = widget.node.getElementsByClassName(
      'alert-info'
    )[0] as HTMLElement;
    expect(element.innerHTML).toBe('');

    historyList.show_info('<p>Test info message</p>');
    expect(element.innerHTML).toBe('<p>Test info message</p>');
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

    const info = widget.node.getElementsByClassName(
      'alert-info'
    )[0] as HTMLElement;
    const danger = widget.node.getElementsByClassName(
      'alert-danger'
    )[0] as HTMLElement;
    const results_panel = widget.node.querySelector(
      '#actions-panel-group'
    ) as HTMLElement;

    // populate the elements
    results_panel.innerHTML = '<p>Some results</p>';

    historyList.show_info('<p>Test info message</p>');
    historyList.show_error('<p>Test error message</p>');

    expect(info.innerHTML).toBe('<p>Test info message</p>');
    expect(danger.innerHTML).toBe('<p>Test error message</p>');

    historyList.clear_list();

    expect(info.innerHTML).toBe('');
    expect(danger.innerHTML).toBe('');
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
    const widget = new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 10));

    const info_box = widget.node.querySelector('.alert-info') as HTMLElement;

    expect(info_box.innerHTML).toContain(
      '<p>There is no history available from the Exchange service</p>'
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
    const widget = new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 10));

    const info_box = widget.node.querySelector('.alert-info') as HTMLElement;

    expect(info_box.innerHTML).toContain(
      '<p>There is no history to show you</p>'
    );
  });
});
