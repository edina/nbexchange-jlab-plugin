import { Widget } from '@lumino/widgets';
// import { JupyterFrontEnd } from '@jupyterlab/application';

import { PageConfig } from '@jupyterlab/coreutils';
// import { Notification } from '@jupyterlab/apputils';

import { requestAPI } from '../handler';

interface IAssignmentDetail {
  exchange: number;
  locally: number;
}

interface IAssignmentRecord {
  [key: string]: IAssignmentDetail;
}

interface IBaAssignmentResponse {
  success: string;
  value: string | IAssignmentRecord;
}

export class BaAssignmentsList {
  panel_group_selector: string;
  panel_group_element: HTMLDivElement;
  widget: Widget;

  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function | null = null;

  constructor(widget: Widget, panel_group_selector: string) {
    this.panel_group_selector = panel_group_selector;
    this.callback = null;
    this.widget = widget;

    const div_elements = widget.node.getElementsByTagName('div');
    this.panel_group_element = <HTMLDivElement>(
      div_elements.namedItem(panel_group_selector)
    );
  }
}

// This is the list of assignments known for this course
export class AssignmentsList {
  widget: Widget;
  assignment_list_selector: string;
  default_assignment_selector: string;
  refresh_selector: string;
  assignment_list: BaAssignmentsList;
  options = new Map();
  base_url: string;
  assignmentResponseData: IBaAssignmentResponse | null;
  assignment_table_element: HTMLTableElement | null;
  default_assignment_element: HTMLElement | null;
  refresh_element: HTMLButtonElement | null;

  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function | null = null;

  constructor(
    widget: Widget,
    assignment_list_selector: string, // where checkboxes go
    default_assignment_selector: string, // the "loading...." message
    refresh_selector: string, // refresh the page
    assignment_list: BaAssignmentsList, // big list of assignments
    options: Map<string, string> // a map
  ) {
    this.assignment_list_selector = assignment_list_selector;
    this.default_assignment_selector = default_assignment_selector;
    this.refresh_selector = refresh_selector;
    this.assignment_table_element = widget.node
      .getElementsByTagName('table')
      .namedItem(assignment_list_selector);
    const buttons = widget.node.getElementsByTagName('button');
    this.widget = widget;

    this.default_assignment_element = document.getElementById(
      default_assignment_selector
    );
    this.refresh_element = buttons.namedItem(refresh_selector);

    this.assignment_list = assignment_list;

    this.options = options;
    this.base_url = options.get('base_url') || PageConfig.getBaseUrl();

    this.assignmentResponseData = null;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    const alert_box = document.getElementById('baautograde-alert-box');
    if (alert_box) {
      alert_box.style.display = 'hidden';
    }

    this.refresh_element!.onclick = function () {
      that.load_list();
    };

    this.bind_events();
  }

  public clear_list(): void {
    // remove list items
    if (this.assignment_table_element!.children.length > 0) {
      this.assignment_table_element!.innerHTML = '';
    }
    // and reset the "loading" line
    const message_element = document.getElementById('assignment_list_default');
    if (message_element) {
      message_element.innerHTML = '<p>Querying to get assignment details</p>';
    }
  }

  private bind_events(): void {
    this.refresh_element!.click();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private async load_list(course?: string, callback?: Function) {
    if (callback) {
      this.callback = callback;
    }
    this.clear_list();

    try {
      const data: IBaAssignmentResponse =
        await requestAPI<any>('getAssignment');
      this.handle_load_list(data);
    } catch (reason: Error | any) {
      console.log('load_list caught error:', reason);
      let msg: string = 'Error on GET /BaAssignment.\n';
      if (reason) {
        if (typeof reason === 'object' && 'message' in reason) {
          msg += reason.message;
        } else {
          msg += reason.toString();
        }
      }
      msg += '';
      this.show_error('<p>' + msg + '</p>');
    }
  }

  private handle_load_list(data: IBaAssignmentResponse): void {
    if (!data) {
      throw new Error('No data returned from GET /BaAssignment');
    }
    console.log('handle_load_list - html fragment:', document.body.outerHTML);
    const message_element = document.getElementById('assignment_list_default');
    console.log(
      'handle_load_list - message_element',
      message_element?.outerHTML,
      ', data:',
      data
    );
    if (data.success) {
      console.log('data.success is true');
      if (typeof data.value === 'string') {
        this.show_error(
          '<p>Error fetching gradable assignments:' + data.value + '</p>'
        );
      } else {
        console.log('data.value is an object:', data.value);
        this.load_list_success(data.value);
      }
    } else {
      console.log('data.success is false');
      message_element!.innerText = 'Error fetching gradable assignments!';
      this.show_error(
        '<p>HistoryList.handle_load_list() failed:</p>\n<pre>' + data + '</pre>'
      );
    }
  }

  private async do_collect(assignent_code: string) {
    const results_area = document.getElementById('results-panel-group');
    if (results_area) {
      this.clear_area(results_area);
      try {
        const data: any = await requestAPI<any>(
          'doCollect?assignment_code=' + assignent_code
        );
        this.handle_response_data(results_area, data);
      } catch (reason) {
        const msg: string = 'Error on GET doCollect.\n' + reason;
        this.show_error('<p>' + msg + '</p>');
      }
    }
  }

  private async do_autograde(assignent_code: string) {
    const results_area = document.getElementById('results-panel-group');
    if (results_area) {
      this.loading_statement(results_area);
      try {
        const data: any = await requestAPI<any>(
          'doAutograde?assignment_code=' + assignent_code
        );
        this.handle_response_data(results_area, data);
      } catch (reason) {
        const msg: string = 'Error on GET /BaAssignment.\n' + reason;
        this.show_error('<p>' + msg + '</p>');
      }
    }
  }

  private handle_response_data(results_area: HTMLElement, data: any): void {
    if (results_area) {
      results_area.innerHTML = data.value;
    }
  }

  private clear_area(element: HTMLElement): void {
    if (element!.children.length > 0) {
      element!.innerHTML = '';
    }
  }

  private loading_statement(element: HTMLElement): void {
    if (element) {
      if (element.children.length > 0) {
        element.innerHTML = '<p class="ba_loader">Loading......</p>';
      }
    }
  }

  private make_button(
    id: string,
    text: string,
    disabled: boolean,
    do_Action: (params?: any) => void,
    actionParams?: any
  ): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement('button');
    button.classList.add('btn');
    button.setAttribute('id', id + '_' + text);
    button.style.margin = '0 1em';
    if (disabled) {
      button.disabled = true;
    } else {
      button.classList.add('btn-primary');
    }
    button.onclick = async () => {
      await do_Action(actionParams);
    };
    button.innerText = text;
    return button;
  }

  private make_row(
    table_body: HTMLTableSectionElement,
    assignment_code: string,
    data: IAssignmentDetail
  ): void {
    const row = document.createElement('tr');
    table_body.append(row);
    row.setAttribute('aria-label', assignment_code);
    const assignment_name_cell = document.createElement('td');
    const values_cell = document.createElement('td');
    const buttons_cell = document.createElement('td');
    row.append(assignment_name_cell, values_cell, buttons_cell);

    assignment_name_cell.innerText = assignment_code;
    values_cell.innerText =
      'Exchange:' + data.exchange + ', Locally:' + data.locally;

    let disable_button = false;
    if (data.exchange === data.locally) {
      disable_button = true;
    }
    const collectButton: HTMLButtonElement = this.make_button(
      'assignent_code',
      'collect',
      disable_button,
      this.do_collect.bind(this),
      assignment_code
    );
    const autogradeButton: HTMLButtonElement = this.make_button(
      'assignent_code',
      'Bulk Autograde',
      false,
      this.do_autograde.bind(this),
      assignment_code
    );
    buttons_cell.append(collectButton, autogradeButton);
  }

  private make_table_heading(table: HTMLTableElement): void {
    const thead = table.createTHead();
    const thead_row = thead.insertRow();
    const head_items = ['Assignment Name', 'Submission Counts', 'Actions'];
    head_items.forEach(headerText => {
      const header_cell = document.createElement('th'); // 'cos the API route is depreciated
      header_cell.textContent = headerText;
      thead_row.appendChild(header_cell);
    });
  }

  private load_list_success(data: IAssignmentRecord): void {
    this.clear_list();
    // build the list of items lin the list
    const table = this.assignment_table_element;
    if (table) {
      console.log('load_list_success - make the table heading');
      this.make_table_heading(table);
      const table_body = table.createTBody();
      console.log('load_list_success - make the table rows');
      for (const assignment_code in data) {
        this.make_row(table_body, assignment_code, data[assignment_code]);
      }
      console.log('load_list_success - made all the table rows');
      // Now toggle the "loading" for the table
      const message_element = document.getElementById(
        'assignment_list_default'
      );
      if (message_element) {
        message_element.innerHTML =
          '<p>This table lists all assignments for the current course<br /\n' +
          '<p>For each assignment, it shows the number of students who have submitted work to the exchange' +
          ' and the number of submissions held locally.</p>\n' +
          '<p>Select the action you want from the table below:</p>\n';
      }
    }
  }

  public show_error(message: string): void {
    const element = this.widget.node.getElementsByClassName('alert-danger')[0];
    if (element) {
      element.innerHTML = message;
    } else {
      console.log('show_error element not found');
      // Notification.emit(message, 'error', { autoClose: false });
    }
  }
}
