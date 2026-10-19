import opencascade from 'opencascade.js';

export class CADKernelManager {
  private static instance: CADKernelManager;
  private oc: any = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): CADKernelManager {
    if (!CADKernelManager.instance) {
      CADKernelManager.instance = new CADKernelManager();
    }
    return CADKernelManager.instance;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const initFunc = (opencascade as any).default || opencascade;
      if (typeof initFunc === 'function') {
        this.oc = await initFunc();
        this.isInitialized = true;
        console.log('OpenCascade CAD Kernel loaded successfully.');
      }
    } catch (err) {
      console.warn('OpenCascade initialization fallback to Three.js parametric kernel:', err);
    }
  }

  public getOCC(): any {
    return this.oc;
  }

  public isKernelReady(): boolean {
    return this.isInitialized;
  }
}

export const cadKernel = CADKernelManager.getInstance();
