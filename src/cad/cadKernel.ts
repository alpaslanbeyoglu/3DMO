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
      // Dynamic import ensures the bundle loads instantly without WASM blocking
      const opencascadeModule = await import('opencascade.js');
      const initFunc = (opencascadeModule as any).default || opencascadeModule;
      if (typeof initFunc === 'function') {
        this.oc = await initFunc();
        this.isInitialized = true;
        console.log('OpenCascade CAD Kernel initialized in background.');
      }
    } catch (err) {
      console.warn('OpenCascade WASM background load skipped, using native Three.js CAD Kernel:', err);
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
