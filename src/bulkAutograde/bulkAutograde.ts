import { Widget } from '@lumino/widgets';

import { PageConfig } from '@jupyterlab/coreutils';
// import { Notification } from '@jupyterlab/apputils';

import { requestAPI } from '../handler';

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
  data: string[];
  assignment_list_element: HTMLFormElement | null;
  default_assignment_element: HTMLButtonElement | null;
  //   dropdown_element: HTMLButtonElement | null;
  refresh_element: HTMLButtonElement | null;

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
      .getElementsByTagName('form')
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

    this.data = [];

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

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

  private async load_list() {
    this.clear_list();

    try {
      const data = await requestAPI<any>('BaAssignment', '');
      this.handle_load_list(data);
    } catch (reason) {
      const msg: string = 'Error on GET /BaAssignment.\n' + reason;
      console.error(msg);
      //   this.show_error(msg);
    }
  }

  private handle_load_list(data: { success: any; value: any }): void {
    if (data.success) {
      this.load_list_success(data.value);
    } else {
      this.default_assignment_element!.innerText =
        'Error fetching gradable assignments!';
      //   this.show_error('HistoryList.handle_load_list() failed' + this.data);
    }
  }

  private load_list_success(data: string[]): void {
    this.data = data;
    this.clear_list();

    // Bypass all the junk about known courses & stuff
    // this.history.load_list('moot');
  }
}
