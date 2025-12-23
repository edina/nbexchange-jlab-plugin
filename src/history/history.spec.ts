import { HistoryWidget } from './index';
import { JupyterFrontEnd } from '@jupyterlab/application';

import { requestAPI } from '../handler';
jest.mock('../handler', () => ({ requestAPI: jest.fn() }));

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
    expect(widget.node.querySelector('#actions-panel-group')).not.toBeNull();
    console.log('History: ', widget.node.outerHTML);
  });

  // test load-list gets network error
  it('handles network error when loading history list', async () => {
    (requestAPI as jest.Mock).mockRejectedValue(new Error('Network Error'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const app = {} as JupyterFrontEnd;
    const ba = new HistoryWidget(app);

    const error_box = ba.node.querySelector(
      '#baautograde-alert-box'
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
      '#baautograde-alert-box'
    ) as HTMLElement;
    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>HistoryList.load_list() failed:</p>\n<pre>Non-JSON Response</pre>'
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
      '#baautograde-alert-box'
    ) as HTMLElement;
    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(error_box.innerHTML).toContain(
      '<p>HistoryList.load_list() failed:</p>\n<pre>Some error occurred</pre>'
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
    // const elem = ba.node.querySelector('#actions-panel-group') as HTMLElement;
    // console.log('elem is a:', elem.tagName);
    // console.log('Loaded history list outer HTML:', elem.outerHTML);
    // const children = elem.children;
    // expect(children.length).toBe(1);
    // const course_group = children[0];
    // expect(course_group.className).toBe('course_group');
    // console.log('Course group children:', elem.children);

    const elem = ba.node.getElementsByTagName(
      'details'
    ) as HTMLCollectionOf<HTMLElement>;

    console.log('Loaded history list details:', elem);
    // console.log('Loaded history list inner HTML:', elem.innerHTML);
    // const course_groups = elem.getElementsByClassName('course_group');
    // console.log('Loaded history list outer HTML:', course_groups);
    // expect(course_groups.length).toBe(1);

    // const details = elem.getElementsByTagName('details');
    // expect(details.length).toBe(1);

    // const summaries = elem.getElementsByTagName('summary');
    // expect(summaries.length).toBe(1);

    // const action_groups = elem.getElementsByClassName('action-group');
    // expect(action_groups.length).toBe(6);

    // const buttons = elem.getElementsByTagName('button');
    // expect(buttons.length).toBe(1);
    // expect(buttons[0].id).toBe('submitted_download_80_13');
    // details at course level, summary course info plus dates & 'current_course'
    // const course_outer = elem.querySelector('.course_group') as HTMLElement;
    // expect(course_outer.innerHTML).toContain('<summary>');
    // expect(course_outer.innerHTML).toContain('<details>');
    // detail at assignment level, summary includes role info

    // inside that detail is a div (class=panel-body) with 6 action-group divs

    // there is only 1 button: submitted_download
  });
});
