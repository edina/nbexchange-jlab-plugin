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
  //   dropdown_selector: string;
  refresh_selector: string;
  assignment_list: BaAssignmentsList;
  //   current_course: string | null;
  options = new Map();
  base_url: string;
  assignmentResponseData: IBaAssignmentResponse | null;
  assignment_list_element: HTMLUListElement | null;
  default_assignment_element: HTMLButtonElement | null;
  //   dropdown_element: HTMLButtonElement | null;
  refresh_element: HTMLButtonElement | null;

  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function | null = null;

  constructor(
    widget: Widget,
    assignment_list_selector: string, // where checkboxes go
    default_assignment_selector: string, // the "loading...." message
    // dropdown_selector: string,
    refresh_selector: string, // refresh the page
    assignment_list: BaAssignmentsList, // big list of assignments
    options: Map<string, string> // a map
  ) {
    this.assignment_list_selector = assignment_list_selector;
    this.default_assignment_selector = default_assignment_selector;
    // this.dropdown_selector = dropdown_selector;
    this.refresh_selector = refresh_selector;
    this.assignment_list_element = widget.node
      .getElementsByTagName('ul')
      .namedItem(assignment_list_selector);
    const buttons = widget.node.getElementsByTagName('button');
    this.default_assignment_element = buttons.namedItem(
      default_assignment_selector
    );
    // this.dropdown_element = buttons.namedItem(dropdown_selector);
    this.refresh_element = buttons.namedItem(refresh_selector);

    this.assignment_list = assignment_list;
    // this.current_course = 'select a course';

    this.options = options;
    this.base_url = options.get('base_url') || PageConfig.getBaseUrl();

    this.assignmentResponseData = null;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    const alert_box = document.getElementById('alert-box');
    if (alert_box) {
      alert_box.style.display = 'hidden';
    }
    // /* Open the dropdown course_list when clicking on dropdown toggle button */
    // if (this.dropdown_element) {
    //   this.dropdown_element.onclick = function () {
    //     that.course_list_element!.classList.toggle('open');
    //   };
    // }

    // /* Close the dropdown course_list if clicking anywhere else */
    // document.onclick = function (event) {
    //   if (
    //     (<HTMLElement>event.target).closest('button') !== that.dropdown_element
    //   ) {
    //     that.assignment_list_element!.classList.remove('open');
    //   }
    // };

    this.refresh_element!.onclick = function () {
      that.load_list();
    };

    this.bind_events();
  }

  public clear_list(): void {
    // remove list items
    if (this.assignment_list_element!.children.length > 0) {
      this.assignment_list_element!.innerHTML = '';
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
      const data: IBaAssignmentResponse = await requestAPI<any>('BaAssignment');
      this.handle_load_list(data);
    } catch (reason) {
      const msg: string = 'Error on GET /BaAssignment.\n' + reason;
      console.error(msg);
      //   this.show_error(msg);
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
      //   this.show_error('HistoryList.handle_load_list() failed' + this.data);
    }
  }

  private make_button(
    id: string,
    text: string,
    disabled: boolean
  ): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'btn-xs');
    button.setAttribute('id', id + '_' + text);
    button.style.margin = '0 1em';
    if (disabled) {
      button.disabled = true;
    }
    // button.onclick = async function(){ ... do something ... }
    button.innerText = text;
    return button;
  }

  private make_row(
    element: HTMLLIElement,
    assignent_code: string,
    data: IAssignmentDetail
  ): void {
    const assignment_name_span = document.createElement('span');
    assignment_name_span.classList.add('col-sm-4');
    const values_span = document.createElement('span');
    values_span.classList.add('col-sm-4');
    const buttons_span = document.createElement('span');
    buttons_span.classList.add('col-sm-4');
    element.append(assignment_name_span, values_span, buttons_span);

    assignment_name_span.innerText = assignent_code;
    values_span.innerText =
      'Exchange:' + data.exchange + ', Locally:' + data.locally;

    let disabled_button = false;
    if (data.exchange === data.locally) {
      console.log();
      disabled_button = true;
    }
    const collectButton: HTMLButtonElement = this.make_button(
      'assignent_code',
      'collect',
      disabled_button
    );
    const autogradeButton: HTMLButtonElement = this.make_button(
      'assignent_code',
      'Bulk Autograde',
      disabled_button
    );
    buttons_span.append(collectButton, autogradeButton);
  }

  private load_list_success(data: IAssignmentRecord): void {
    this.clear_list();
    // build the list of items lin the list
    for (const assignment_code in data) {
      const element: HTMLLIElement = document.createElement('li');
      this.assignment_list_element?.append(element);
      element.classList.add('action-row');
      this.make_row(element, assignment_code, data[assignment_code]);
    }
    // Now toggle the "loading" for the table
    if (this.default_assignment_element) {
      this.default_assignment_element.style.display = 'None';
    }
    if (this.assignment_list_element) {
      this.assignment_list_element.style.display = 'block';
      this.assignment_list_element.style.width = '100%';
    }
  }
}
