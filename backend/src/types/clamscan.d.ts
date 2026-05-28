declare module "clamscan" {
  interface ClamScanOptions {
    removeInfected?: boolean;
    quarantineInfected?: boolean;
    scanLog?: string | null;
    debugMode?: boolean;
    clamdscan?: {
      socket?: string;
      host?: string;
      port?: number;
      timeout?: number;
      localFallback?: boolean;
    };
    preference?: string;
  }

  interface ScanResult {
    isInfected: boolean;
    viruses?: string[];
  }

  class NodeClam {
    init(options: ClamScanOptions): Promise<NodeClam>;
    isInfected(filePath: string): Promise<ScanResult>;
    getVersion(): Promise<string>;
  }

  export = NodeClam;
}
