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

import { HistoryWidget } from '../../../src/history';

/**
 * The history plugin ID
 */
const pluginID = '@jupyter/nbexchange:history';

/**
 * The command ID
 */
const commandID = 'nbexchange:open-history';

/**
 * History page plugin.
 */
const historyPlugin: JupyterFrontEndPlugin<void> = {
  id: pluginID,
  description: 'NbExchange History extension',
  autoStart: true,
  requires: [],
  optional: [ILayoutRestorer, INotebookTree, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer | null,
    notebookTree: INotebookTree | null,
    palette: ICommandPalette | null
  ) => {
    let widget: MainAreaWidget<HistoryWidget>;

    const tracker = new WidgetTracker<MainAreaWidget<HistoryWidget>>({
      namespace: 'nbexchange-history'
    });

    app.commands.addCommand(commandID, {
      label: 'Exchange History',
      isEnabled: () => true,
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new HistoryWidget(app);
          widget = new MainAreaWidget({ content });
          widget.id = 'nbexchange-history';
          widget.addClass('nbgrader-mainarea-widget');
          widget.title.label = 'Exchange History';
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
        name: () => 'nbexchange-history'
      });
    }
  }
};

export default historyPlugin;
