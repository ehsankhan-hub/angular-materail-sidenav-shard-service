export interface LogCurveInfo {
    mnemonic: string;
    unit: string;
  }
  
  export interface WellBoreLog {
    uid: string;
    name: string;
    wellboreUid: string;
    logCurveInfo: LogCurveInfo[];
  }
  
  export interface WellBoreLogsList {
    depthLogs?: any[];   // keep for compatibility, even if unused
    timeLogs?: any[];
    logs: WellBoreLog[];
    SuppMsgOut?: string;
  }

  export interface WellBore {
    uid: string;
    name: string;
    wellUid: string;
  }

  export interface Well {
    uid: string;
    name: string;
  }
  
  
  export interface WellBoreList {
    wellbores: WellBore[];
    SuppMsgOut?: string;
  }

  
  