import { Widget } from '@lumino/widgets';

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
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function | null = null;

  constructor(widget: Widget, panel_group_selector: string) {
    this.panel_group_selector = panel_group_selector;
    this.callback = null;

    const div_elements = widget.node.getElementsByTagName('div');
    this.panel_group_element = <HTMLDivElement>(
      div_elements.namedItem(panel_group_selector)
    );
  }
}

// This is the list of assignments known for this course
export class AssignmentsList {
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
    } catch (reason) {
      const msg: string = 'Error on GET /BaAssignment.\n' + reason;
      console.error(msg);
      this.show_error('<p>' + msg + '</p>');
    }
  }

  private handle_load_list(data: IBaAssignmentResponse): void {
    if (data.success) {
      if (typeof data.value === 'string') {
        this.default_assignment_element!.innerText =
          'Error fetching gradable assignments:' + data.value;
      } else {
        this.load_list_success(data.value);
      }
    } else {
      this.default_assignment_element!.innerText =
        'Error fetching gradable assignments!';
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
        console.error(msg);
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
        console.error(msg);
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
      this.make_table_heading(table);
      const table_body = table.createTBody();
      for (const assignment_code in data) {
        this.make_row(table_body, assignment_code, data[assignment_code]);
      }
    }
    // Now toggle the "loading" for the table
    if (this.default_assignment_element) {
      this.default_assignment_element.innerText =
        'Select the action you want from the table below';
    }
  }

  public show_error(message: string): void {
    const element = document.getElementById('baautograde-alert-box');
    if (element) {
      element.innerHTML = message;
    }
  }
}
