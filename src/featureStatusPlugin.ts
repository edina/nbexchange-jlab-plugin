import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { FeatureStatusService, IFeatureStatus } from './featureStatus';

const FEATURE_STATUS_PLUGIN_ID = '@jupyter/nbexchange:feature-status';

/**
 * Standalone plugin that provides the IFeatureStatus service.
 * This service is required by both the History and Bulk Autograde plugins.
 */
export const featureStatusPlugin: JupyterFrontEndPlugin<IFeatureStatus> = {
  id: FEATURE_STATUS_PLUGIN_ID,
  description: 'Provides feature status service for nbexchange extensions.',
  autoStart: true,
  provides: IFeatureStatus,
  activate: (app: JupyterFrontEnd): IFeatureStatus => {
    const featureStatus = new FeatureStatusService();
    void featureStatus.refresh();
    return featureStatus;
  }
};

export default featureStatusPlugin;
