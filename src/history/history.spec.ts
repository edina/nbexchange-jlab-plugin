import { HistoryWidget } from './index';
import { JupyterFrontEnd } from '@jupyterlab/application';

import { requestAPI } from '../handler';
jest.mock('../handler', () => ({ requestAPI: jest.fn() }));

/* Tests still to write */
// if data is true, but null
// formatDate test
// clear_list clears both alert boxes
// history successfully returns 0 records
// `current_course` class added to current course details element
// ... and the summary text
// load_history gets success: False
// show_error gets widget with missing 'alert-danger' class
// show_info gets widget with missing 'alert-info' class
// ? Can we get rid of the whole `CourseList` class ?
// ? Does history even have a "disabled button" concept ?
// that the download button only appears if you are an instructor on the course
//   .... even if your _current_ role is student
// that the collect button only appears in you are an instructor on the current course
// test Actions show_error

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
    const ba = new HistoryWidget(app);

    const error_box = ba.node.querySelector(
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
    const ba = new HistoryWidget(app);

    const error_box = ba.node.querySelector(
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
    const ba = new HistoryWidget(app);

    const error_box = ba.node.querySelector(
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
    const mockData = [
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
                user: '1-kiz'
              },
              {
                action: 'AssignmentActions.fetched',
                timestamp: '2022-01-17 15:51:52.621861 UTC',
                user: '1-kiz'
              },
              {
                action: 'AssignmentActions.submitted',
                timestamp: '2022-01-17 15:53:11.064558 UTC',
                user: '1-kiz'
              },
              {
                action: 'AssignmentActions.collected',
                timestamp: '2022-01-17 15:53:18.915705 UTC',
                user: '1-kiz'
              },
              {
                action: 'AssignmentActions.feedback_released',
                timestamp: '2022-01-17 15:54:34.539665 UTC',
                user: '1-kiz'
              },
              {
                action: 'AssignmentActions.feedback_fetched',
                timestamp: '2022-01-17 15:54:43.010072 UTC',
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
        course_title: 'my_course_code'
      }
    ];
    // mock get_current course to return course code
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: mockData
    });
    const app = {} as JupyterFrontEnd;
    const ba = new HistoryWidget(app);

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 1));

    console.log('History widget after loading list:', ba.node.outerHTML);
    const elems = document.querySelector('details[name="course_level_group"]');
    console.log(elems?.outerHTML);
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
    const ba = new HistoryWidget(app);
    const error_box = ba.node.querySelector('.alert-info') as HTMLElement;

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>There is no History to show you</p>'
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
    const ba = new HistoryWidget(app);
    const error_box = ba.node.querySelector('.alert-info') as HTMLElement;

    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>There is no History to show you</p>'
    );
  });
});
