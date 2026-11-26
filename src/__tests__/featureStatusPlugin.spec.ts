/**
 * Unit tests for the FeatureStatusPlugin
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { FeatureStatusService, IFeatureStatus } from '../featureStatus';
import { featureStatusPlugin } from '../featureStatusPlugin';

describe('featureStatusPlugin', () => {
  let app: JupyterFrontEnd;

  beforeEach(() => {
    jest.clearAllMocks();
    app = {
      shell: {} as any
    } as JupyterFrontEnd;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should have correct plugin ID', () => {
    expect(featureStatusPlugin.id).toBe('@jupyter/nbexchange:feature-status');
  });

  it('should have correct description', () => {
    expect(featureStatusPlugin.description).toBe(
      'Provides feature status service for nbexchange extensions.'
    );
  });

  it('should autoStart', () => {
    expect(featureStatusPlugin.autoStart).toBe(true);
  });

  it('should provide IFeatureStatus token', () => {
    expect(featureStatusPlugin.provides).toBe(IFeatureStatus);
  });

  it('should not require any dependencies', () => {
    expect(featureStatusPlugin.requires).toBeUndefined();
  });

  it('should have no optional dependencies', () => {
    expect((featureStatusPlugin as any).optional).toBeUndefined();
  });

  describe('activate', () => {
    it('should create and return a FeatureStatusService instance', () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const originalRefresh = FeatureStatusService.prototype.refresh;
      FeatureStatusService.prototype.refresh = mockRefresh;

      const result = featureStatusPlugin.activate(app);

      expect(result).toBeInstanceOf(FeatureStatusService);
      expect(mockRefresh).toHaveBeenCalled();

      // Restore original method
      FeatureStatusService.prototype.refresh = originalRefresh;
    });

    it('should call refresh on the service instance', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const originalRefresh = FeatureStatusService.prototype.refresh;
      FeatureStatusService.prototype.refresh = mockRefresh;

      featureStatusPlugin.activate(app);

      // Wait for the async refresh to be called
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRefresh).toHaveBeenCalledTimes(1);

      // Restore original method
      FeatureStatusService.prototype.refresh = originalRefresh;
    });
  });

  describe('plugin integration', () => {
    it('should provide a service that implements IFeatureStatus', () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const originalRefresh = FeatureStatusService.prototype.refresh;
      FeatureStatusService.prototype.refresh = mockRefresh;

      const service = featureStatusPlugin.activate(app) as FeatureStatusService;

      // Check that the service implements IFeatureStatus interface
      expect(service).toHaveProperty('historyEnabled');
      expect(service).toHaveProperty('bulkAutogradeEnabled');
      expect(service).toHaveProperty('isReady');
      expect(service).toHaveProperty('refresh');
      expect(service).toHaveProperty('historyEnabledChanged');
      expect(service).toHaveProperty('bulkAutogradeEnabledChanged');

      FeatureStatusService.prototype.refresh = originalRefresh;
    });

    it('should initialize service with default values', () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const originalRefresh = FeatureStatusService.prototype.refresh;
      FeatureStatusService.prototype.refresh = mockRefresh;

      const service = featureStatusPlugin.activate(app) as FeatureStatusService;

      expect(service.historyEnabled).toBe(false);
      expect(service.bulkAutogradeEnabled).toBe(false);
      expect(service.isReady).toBe(false);

      FeatureStatusService.prototype.refresh = originalRefresh;
    });
  });
});
