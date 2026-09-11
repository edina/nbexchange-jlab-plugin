import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import { INotebookTree } from '@jupyter-notebook/tree';

import { BulkAutogradeWidget } from '../../../src/bulkAutograde';

/**
 * The bulk autograde plugin ID
 */
const pluginID = '@jupyter/nbexchange:bulkautograde';

/**
 * The command ID
 */
const commandID = 'nbexchange:open-bulk-autograde';

/**
 * Bulk Autograde page plugin.
 */
const bulkAutogradePlugin: JupyterFrontEndPlugin<void> = {
  id: pluginID,
  description: 'NbExchange Bulk Autograde extension',
  autoStart: true,
  requires: [],
  optional: [ILayoutRestorer, INotebookTree, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer | null,
    notebookTree: INotebookTree | null,
    palette: ICommandPalette | null
  ) => {
    let widget: MainAreaWidget<BulkAutogradeWidget>;

    const tracker = new WidgetTracker<MainAreaWidget<BulkAutogradeWidget>>({
      namespace: 'nbexchange-bulkautograde'
    });

    app.commands.addCommand(commandID, {
      label: 'Bulk Autograding',
      isEnabled: () => true,
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new BulkAutogradeWidget(app);
          widget = new MainAreaWidget({ content });
          widget.id = 'nbexchange-bulkautograde';
          widget.addClass('nbgrader-mainarea-widget');
          widget.title.label = 'Bulk Autograding';
          widget.title.closable = true;
        }
        if (!tracker.has(widget)) {
          tracker.add(widget);
        }

        if (!widget.isAttached) {
          if (notebookTree) {
            notebookTree.addWidget(widget);
            notebookTree.currentWidget = widget;
          } else {
            app.shell.add(widget, 'main');
          }
        }

        widget.content.update();
        app.shell.activateById(widget.id);
      }
    });

    if (palette) {
      palette.addItem({
        command: commandID,
        category: 'NbExchange'
      });
    }

    if (restorer !== null) {
      restorer.restore(tracker, {
        command: commandID,
        name: () => 'nbexchange-bulkautograde'
      });
    }
  }
};

export default bulkAutogradePlugin;
