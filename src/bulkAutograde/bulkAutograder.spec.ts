/**
 * Unit tests for bulkAutograde
 */

import { BulkAutogradeWidget } from './index';
import { JupyterFrontEnd } from '@jupyterlab/application';

import { requestAPI } from '../handler';
jest.mock('../handler', () => ({ requestAPI: jest.fn() }));

import { BaAssignmentsList, AssignmentsList } from './bulkAutograde';

describe('bulkAutograde instanciation', () => {
  beforeEach(() => {
    // ensure a clean DOM for each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('creates base HTML fragment', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({ success: 'true', value: {} });

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    expect(ba.node.querySelector('#bulkautograder_h2')).not.toBeNull();
    expect(ba.node.querySelector('#assignment-table')).not.toBeNull();
    expect(ba.node.querySelector('#assignment_list_default')).not.toBeNull();
    expect(ba.node.querySelector('#refresh_assignment_list')).not.toBeNull();
    expect(ba.node.querySelector('#baautograde-alert-box')).not.toBeNull();
    expect(ba.node.querySelector('#results-panel-group')).not.toBeNull();
  });

  it('creates an AssignmentsList instance', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({ success: 'true', value: {} });

    const app = {} as JupyterFrontEnd;
    const widget = new BulkAutogradeWidget(app);
    const assignment_list = new AssignmentsList(
      widget,
      'assignment-table',
      'assignment_list_default',
      'refresh_assignment_list',
      new BaAssignmentsList(widget, 'results-panel-group'),
      new Map()
    );

    expect(assignment_list).toBeInstanceOf(AssignmentsList);
  });
});

describe('BulkAutogradeWidget integration', () => {
  beforeEach(() => {
    // ensure a clean DOM for each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('handles getAssignment API failure gracefully', async () => {
    const err = new Error('Faux network failure');
    (requestAPI as jest.Mock).mockRejectedValue(err);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    const error_box = ba.node.querySelector(
      '#baautograde-alert-box'
    ) as HTMLElement;
    // wait for the asynchronous load_list invoked by the widget
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(errorSpy).toHaveBeenCalled();

    expect(error_box.innerHTML).toContain('Error on GET /BaAssignment');
    errorSpy.mockRestore();
  });

  it('shows string error if getAssignment says success:false', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'false',
      value: 'no assignments'
    });

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const msgEl = ba.node.querySelector(
      '#baautograde-alert-box'
    ) as HTMLElement;
    expect(msgEl.innerHTML).toContain(
      '<p>AssignmentsList.load_list() failed:</p>\n<pre>no assignments</pre>'
    );
  });

  it('shows string error if getAssignment says success:true', async () => {
    (requestAPI as jest.Mock).mockResolvedValue({
      success: 'true',
      value: 'no assignments'
    });

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const msgEl = ba.node.querySelector(
      '#baautograde-alert-box'
    ) as HTMLElement;
    expect(msgEl.innerHTML).toContain(
      '<p>Error fetching gradable assignments:</p>\n<pre>no assignments</pre>'
    );
  });

  it('builds table on success and buttons show as expected', async () => {
    (requestAPI as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'getAssignment') {
        return Promise.resolve({
          success: 'true',
          value: {
            assign1: { exchange: 1, locally: 0 },
            assign2: { exchange: 1, locally: 1 }
          }
        });
      }
      if ((endpoint as string).startsWith('doCollect?')) {
        return Promise.resolve({ value: '<div>collected</div>' });
      }
      return Promise.resolve({});
    });

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const msgEl = ba.node.querySelector(
      '#assignment_list_default'
    ) as HTMLElement;
    expect(msgEl.innerHTML).toContain(
      '<p>Querying to get assignment details</p>'
    );
    const table = ba.node.querySelector(
      '#assignment-table'
    ) as HTMLTableElement;
    expect(table.querySelector('thead th')!.textContent).toContain(
      'Assignment Name'
    );

    // Check assign1 row: both buttons enabled
    let assignRow = table.querySelector(
      'tr[aria-label="assign1"]'
    ) as HTMLTableRowElement;
    expect(assignRow).not.toBeNull();

    let collectBtn = ba.node.querySelector(
      '#assign1_collect'
    ) as HTMLButtonElement;
    const autogradeBtn = ba.node.querySelector(
      '#assign1_Bulk_Autograde'
    ) as HTMLButtonElement;

    expect(collectBtn).not.toBeNull();
    expect(collectBtn.disabled).toBe(false);
    expect(autogradeBtn).not.toBeNull();

    // Check assign2 row: collect button disabled
    assignRow = table.querySelector(
      'tr[aria-label="assign2"]'
    ) as HTMLTableRowElement;
    expect(assignRow).not.toBeNull();
    collectBtn = ba.node.querySelector('#assign2_collect') as HTMLButtonElement;

    expect(collectBtn).not.toBeNull();
    expect(collectBtn.disabled).toBe(true);
  });

  it('The collect button works correctly', async () => {
    (requestAPI as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'getAssignment') {
        return Promise.resolve({
          success: 'true',
          value: {
            assign1: { exchange: 1, locally: 0 },
            assign2: { exchange: 1, locally: 1 }
          }
        });
      }
      if ((endpoint as string).startsWith('doCollect?')) {
        return Promise.resolve({
          success: true,
          value: '<div>collected</div>'
        });
      }
      return Promise.resolve({});
    });

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const collectBtn = ba.node.querySelector(
      '#assign1_collect'
    ) as HTMLButtonElement;

    // click collect
    collectBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const results = ba.node.querySelector(
      '#results-panel-group'
    ) as HTMLElement;

    expect(results.innerHTML).toContain('collected');
  });

  // row2 rather than row1 since row2 collect button is disabled
  it('The disabled collect button does not work function', async () => {
    (requestAPI as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'getAssignment') {
        return Promise.resolve({
          success: 'true',
          value: {
            assign1: { exchange: 1, locally: 0 },
            assign2: { exchange: 1, locally: 1 }
          }
        });
      }
      if ((endpoint as string).startsWith('doCollect?')) {
        return Promise.resolve({
          success: true,
          value: '<div>collected</div>'
        });
      }

      return Promise.resolve({});
    });

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const collectBtn = ba.node.querySelector(
      '#assign2_collect'
    ) as HTMLButtonElement;

    // click collect
    collectBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const results = ba.node.querySelector(
      '#results-panel-group'
    ) as HTMLElement;

    expect(results.innerHTML).not.toContain('collected');
  });

  it('The autograde button works correctly', async () => {
    (requestAPI as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'getAssignment') {
        return Promise.resolve({
          success: 'true',
          value: {
            assign1: { exchange: 1, locally: 0 },
            assign2: { exchange: 1, locally: 1 }
          }
        });
      }

      if ((endpoint as string).startsWith('doAutograde?')) {
        return Promise.resolve({ value: '<div>autograded</div>' });
      }
      return Promise.resolve({});
    });

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const table = ba.node.querySelector(
      '#assignment-table'
    ) as HTMLTableElement;
    expect(table.querySelector('thead th')!.textContent).toContain(
      'Assignment Name'
    );

    const autogradeBtn = ba.node.querySelector(
      '#assign1_Bulk_Autograde'
    ) as HTMLButtonElement;

    await new Promise(resolve => setTimeout(resolve, 0));
    const results = ba.node.querySelector(
      '#results-panel-group'
    ) as HTMLElement;

    // click autograde
    autogradeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(results.innerHTML).toContain('autograded');
  });

  it('handles collect api failure gracefully', async () => {
    (requestAPI as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'getAssignment') {
        return Promise.resolve({
          success: 'true',
          value: {
            assign1: { exchange: 1, locally: 0 }
          }
        });
      }
      return Promise.reject('bad');
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const collectBtn = ba.node.querySelector(
      '#assign1_collect'
    ) as HTMLButtonElement;
    collectBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalled();
    const alert = ba.node.querySelector(
      '#baautograde-alert-box'
    ) as HTMLElement;
    expect(alert.innerHTML).toContain('Error on GET doCollect');

    errorSpy.mockRestore();
  });

  it('handles autograde api failure gracefully', async () => {
    (requestAPI as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'getAssignment') {
        return Promise.resolve({
          success: 'true',
          value: {
            assign1: { exchange: 1, locally: 0 }
          }
        });
      }
      return Promise.reject('bad');
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const app = {} as JupyterFrontEnd;
    const ba = new BulkAutogradeWidget(app);

    await new Promise(resolve => setTimeout(resolve, 0));

    const autogradeBtn = ba.node.querySelector(
      '#assign1_Bulk_Autograde'
    ) as HTMLButtonElement;
    autogradeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalled();
    const alert = ba.node.querySelector(
      '#baautograde-alert-box'
    ) as HTMLElement;
    expect(alert.innerHTML).toContain('Error on GET doAutograde');

    errorSpy.mockRestore();
  });
});
