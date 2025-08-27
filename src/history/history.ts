import { Widget } from '@lumino/widgets';

import { PageConfig } from '@jupyterlab/coreutils';

import { requestAPI } from '../handler';

interface ActionType {
    id: string;
    display: string;
}

const actionTypes: ActionType[] = [
    { id: "AssignmentActions.released", display: "Released" },
    { id: "AssignmentActions.fetched", display: "Fetched" },
    { id: "AssignmentActions.submitted", display: "Submitted" },
    { id: "AssignmentActions.collected", display: "Collected" },
    { id: "AssignmentActions.feedback_released", display: "Feedback Released" },
    { id: "AssignmentActions.feedback_fetched", display: "Feedback Fetched" },
]

export class HistoryList {
    panel_group_selector: string;
    panel_group_element: HTMLDivElement;
    callback: Function | null = null;

    // TODO
    constructor(widget: Widget, panel_group_selector: string) {
        this.panel_group_selector = panel_group_selector;
        this.callback = null;

        const div_elements = widget.node.getElementsByTagName('div');
        this.panel_group_element = <HTMLDivElement>div_elements.namedItem(panel_group_selector);
        // TODO
    }

    public clear_list(): void {
        this.panel_group_element.innerHTML = '';
    }

    private load_list_success(data: any[]): void {
        this.clear_list();

        for (let i=0; i<data.length; i++) {
            const assignments: any[] = data[i]['assignments'];

            console.log("Assignments count", assignments.length);
            for(let j=0; j<assignments.length; j++) {
                const assignment = assignments[j];
                const assignment_code = assignment['assignment_code'];
                const assignment_id = assignment['assignment_id'];
                console.log("Assignment: ",assignment_code);
                // Create assignment panel
                const assignment_panel_elem = document.createElement('div');
                assignment_panel_elem.classList.add('panel', 'panel-default');
                const panel_body_id = "assignment-panel-body-" + assignment_id;
                assignment_panel_elem.innerHTML = ([
                    '      <div class="panel-heading">',
                    '        ' + assignment_code + ' <' + assignment_id + '>',
                    '      </div>',
                    '      <div class="panel-body" id="' + panel_body_id + '">',
                    '      </div>',
                ].join('\n'));
                this.panel_group_element.append(assignment_panel_elem);

                const actions: any[] = assignment['actions'];
                console.log("Actions: \n"+ JSON.stringify(actions));
                // actions.sort((a,b) => (a.action > b.action) ? 1 : ((b.action > a.action) ? -1 : 0))

                for (let j=0; j<actionTypes.length; j++) {
                    const groupActions: any[] = actions.filter((a) => a.action === actionTypes[j].id);

                    if(groupActions.length <= 0) {
                        console.log("Didn't find any actions for: "+ actionTypes[j].id);
                    }

                    // Add group in panel_body_id
                    new ActionGroup(assignment_panel_elem, panel_body_id, actionTypes[j].display, groupActions);
                }
            }
        }

        // TODO

        if (this.callback) {
            this.callback();
            this.callback = null;
        }
    }

    public async load_list(course: string, callback?: Function){
        if(callback) {
            this.callback = callback;
        }
        this.clear_list();
        try {
            const data = await requestAPI<any>('history?course_id=' + course);
            // console.log(data)
            if(data.success) {
                this.load_list_success(<any[]>data.value)
            } else {
                this.show_error(<string>data.value)
            }
        } catch (reason) {
            console.error(`Error on GET /history.\n${reason}`);
        }
    }

    public show_error(error: string): void {
        // TODO
    }
}

export class CourseList{
    course_list_selector: string;
    default_course_selector: string;
    dropdown_selector: string;
    refresh_selector: string;
    history: HistoryList;
    current_course: string | null;
    options = new Map();
    base_url: string;
    data : string[];
    course_list_element : HTMLUListElement | null;
    default_course_element: HTMLButtonElement | null;
    dropdown_element: HTMLButtonElement | null;
    refresh_element: HTMLButtonElement | null;

    constructor(widget: Widget, course_list_selector: string, default_course_selector: string, dropdown_selector: string, refresh_selector: string, history: HistoryList, options: Map<string, string>) {
        this.course_list_selector = course_list_selector;
        this.default_course_selector = default_course_selector;
        this.dropdown_selector = dropdown_selector;
        this.refresh_selector = refresh_selector;
        this.course_list_element = widget.node.getElementsByTagName('ul').namedItem(course_list_selector);
        var buttons = widget.node.getElementsByTagName('button');
        this.default_course_element = buttons.namedItem(default_course_selector);
        this.dropdown_element = buttons.namedItem(dropdown_selector);
        this.refresh_element = buttons.namedItem(refresh_selector);

        this.history = history;
        this.current_course = 'select a course';

        //options = options || {};
        this.options = options;
        this.base_url = options.get('base_url') || PageConfig.getBaseUrl();

        this.data = [];

        var that = this;

        /* Open the dropdown course_list when clicking on dropdown toggle button */
        if(this.dropdown_element) {
            this.dropdown_element.onclick = function () {
                that.course_list_element!.classList.toggle('open');
            }
        }

        /* Close the dropdown course_list if clicking anywhere else */
        document.onclick = function (event) {
            if ((<HTMLElement>event.target).closest('button') != that.dropdown_element) {
                that.course_list_element!.classList.remove('open');
            }
        }

        this.refresh_element!.onclick = function () {
            that.load_list();
        }

        this.bind_events();
    }

    private enable_list(): void {
        this.dropdown_element!.removeAttribute("disabled");
    };

    private disable_list(): void {
        this.dropdown_element!.setAttribute("disabled", "disabled");
    };

    public clear_list(): void {
        // remove list items
        if(this.course_list_element!.children.length > 0){
            this.course_list_element!.innerHTML = '';
        }
    };

    private bind_events(): void {
        this.refresh_element!.click();
    };

    private async load_list() {
        this.disable_list()
        this.clear_list();
        // this.history.clear_list(true);

        try {
            const data = await requestAPI<any>('courses', '');
            this.handle_load_list(data)
        } catch (reason) {
            console.error(`Error on GET /courses.\n${reason}`);
        }

    };

    private handle_load_list(data: { success: any; value: any; }): void {
        if (data.success) {
            this.load_list_success(data.value);
        } else {
            this.default_course_element!.innerText = "Error fetching courses!";
            this.enable_list();
            // this.history.show_error(data.value);
        }
    };

    private load_list_success(data: string[]): void {
        this.data = data;
        this.disable_list()
        this.clear_list();

        if (this.data.length === 0) {
            this.default_course_element!.innerText = "No courses found.";
            this.history.clear_list();
            this.enable_list()
            return;
        }

        if (this.current_course !== null && !this.data.includes(this.current_course)) {
            this.current_course = null;
        }

        if (this.current_course === null) {
            this.change_course(this.data[0]);
        } else {
            // we still want to "change" the course here to update the
            // history list
            this.change_course(this.current_course);
        }
    };

    private change_course(course: string): void {
        this.disable_list();
        if (this.current_course !== null) {
            this.default_course_element!.innerText = course;
        }
        this.current_course = course;
        this.default_course_element!.innerText = this.current_course;
        const success = () => {
            this.load_history_success()
        };
        this.history.load_list(course, success);
    };

    private load_history_success(): void {
        if (this.data) {
            const that = this;
            const set_course = function (course: string) {
                return function () {
                    that.change_course(course);
                };
            };

            for (let i=0; i<this.data.length; i++) {
                const a = document.createElement('a');
                a.href = '#';
                a.innerText = this.data[i];
                const element = document.createElement('li');
                element.append(a);
                element.onclick = set_course(this.data[i]);
                this.course_list_element!.append(element);
            }
            this.data = [];
        }
        this.enable_list();
    };
}

class ActionGroup {
    constructor(
        panel_elem: HTMLDivElement,
        parent: string,
        title: string,
        actions: Action[]
    ){
        let element: HTMLDivElement = document.createElement('div');
        element.classList.add('action-group');
        this.make_row(element, title, actions);
        const div_elements = panel_elem.getElementsByTagName('div');
        const parent_elem = <HTMLDivElement>div_elements.namedItem(parent);
        parent_elem.append(element)
    }

    private make_row(element: HTMLDivElement, title: string, actions: Action[]): void {
        const row = document.createElement('details');
        const summary = document.createElement("summary");

        const title_span = document.createElement('span');
        const count_span = document.createElement('span');
        count_span.classList.add('action-badge')

        title_span.innerText = title
        count_span.innerText = String(actions.length);

        summary.innerText = title;
        summary.append(count_span)
        row.append(summary)

        for(let i=0; i<actions.length; i++) {
            new Action(row, actions[i]);
        }

        element.append(row);
    };
}

class Action {

    constructor(
        parent_elem: HTMLElement,
        data: any
    ){
        let element: HTMLDivElement = document.createElement('div');
        element.classList.add('action-row')
        this.make_row(element, data);
        parent_elem.append(element)
    }

    private make_row(element: HTMLDivElement, data: any): void {
        const row = document.createElement('div');
        row.classList.add('col-md-12');

        const timestamp_span = document.createElement('span');
        timestamp_span.classList.add('col-sm-4')
        const user_span = document.createElement('span');
        user_span.classList.add('col-sm-4')

        const date = new Date(data['timestamp']);
        timestamp_span.innerText = date.toLocaleDateString() + " " + date.toLocaleTimeString();
        user_span.innerText = data['user']

        row.append(timestamp_span)
        row.append(user_span)

        element.append(row);
    };

}
