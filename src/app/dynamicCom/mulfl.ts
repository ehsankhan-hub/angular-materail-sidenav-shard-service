/// multiw
ngOnInit(): void {
    // ✅ Only set default wells if BehaviorSubject is empty
    const current = this.staticTemplateSharedService.getMultiWellFilterData();
    if (!current.wells || current.wells.length === 0) {
      console.log('Initializing default wells...');
      this.staticTemplateSharedService.setMultiWellFilterData(this.selectedWells);
    }
  
    // Subscribe to reactive updates (keep as-is)
    this.staticTemplateSharedService.multiWellFilterData$.subscribe((data: any) => {
      this.filteredData = data;
      if (this.filteredData?.wells?.length > 0) {
        console.log('Received wells from shared service:', this.filteredData);
        this.processGraphData(this.filteredData);
      }
    });
  }

/////
/// multiw


addWell() {
    const currentSelection = this.staticTemplateSharedService.getMultiWellFilterData();
    this.dialogRef = this.dialog.open(MultiWellFilterComponent, {
      width: "80%",
      height: "80vh",
      data: currentSelection,
    });
  }



  ////////////

  UpdateGuageValue(dynamicWells: any[]): void {
    if (!dynamicWells || dynamicWells.length === 0) return;
  
    if (this.staticTemplateSharedService.surveyData?.trajectoryStation) {
      this.surveyData = this.staticTemplateSharedService.surveyData.trajectoryStation;
    }
  
    if (this.staticTemplateSharedService.wellboreObject) {
      this.isUpdateGuageRunning = true;
      let logObjects: any[] = this.staticTemplateSharedService.wellboreObject;
      let logObject = logObjects.find(
        (x) => x.objectName == this.wellService.getLogObjectFullName("LWD_Time")
      );
  
      if (!logObject) return;
  
      let logID = logObject.objectId;
      let min = new Date(logObject.endIndex);
      min.setHours(min.getHours() - 3);
  
      let startval =
        formatDate(min, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z";
  
      // ✅ Loop through each selected well
      dynamicWells.forEach((wellItem: any) => {
        let queryParameter: ILogDataQueryParameter = {
          wellUid: wellItem.well,
          logUid: logID,
          wellboreUid: wellItem.wellbore,
          logName: logObject.objectName,
          indexType: logObject.indexType,
          indexCurve: logObject.indexCurve,
          startIndex: startval,
          endIndex: logObject.endIndex,
          isGrowing: logObject.objectGrowing,
          mnemonicList: wellItem.mnemonics.join(","), // now per-well
        };
  
        this.wellService.getLogData(queryParameter).subscribe((response) => {
          let logData: any = response;
  
          if (!logData?.logs?.[0]?.logData) return;
          const logInfo = logData.logs[0].logData;
  
          // ✅ Loop through mnemonics per well
          wellItem.mnemonics.forEach((mnemonic: string) => {
            let values = this.wellService.getMnemoicValueAndUnit(logInfo, mnemonic);
            console.log(`Values for ${wellItem.well} - ${mnemonic}:`, values);
  
            if (mnemonic === "PRO_L") {
              this.depthGuageValue = values[0];
              this.depthGuageUnit = values[1];
              const depthObj = this.cardsConfig.find(
                (item) => item.label === this.depthGuageLabel
              );
              if (depthObj) {
                depthObj["value"] = this.depthGuageValue;
                depthObj["unit"] = this.depthGuageUnit;
                depthObj["color"] = this.depthGuageColor;
              }
            }
          });
  
          // ✅ Update fixed gauges
          let bitDepthValues = this.wellService.getMnemoicValueAndUnit(logInfo, "BITDEPTH");
          this.bitDepthGuageValue = bitDepthValues[0];
          this.bitDepthGuageUnit = bitDepthValues[1];
          const bitDepthObj = this.cardsConfig.find(
            (item) => item.label === this.bitDepthGuageLabel
          );
          if (bitDepthObj) {
            bitDepthObj["value"] = this.bitDepthGuageValue;
            bitDepthObj["unit"] = this.bitDepthGuageUnit;
            bitDepthObj["color"] = this.bitDepthGuageColor;
          }
  
          // TVD, Azimuth, etc. (same as your current logic)
          let TVDValues = this.wellService.getMnemoicValueAndUnit(logInfo, "TVD");
          this.tvdValue = TVDValues[0];
          this.tvdUnit = TVDValues[1];
          const TVDDepthObj = this.cardsConfig.find(
            (item) => item.label === this.tvdGuageLabel
          );
          if (TVDDepthObj) {
            TVDDepthObj["value"] = this.tvdValue;
            TVDDepthObj["unit"] = this.tvdUnit;
            TVDDepthObj["color"] = this.tvdGuageColor;
          }
  
          // Block position
          let blockPositionValues = this.wellService.getMnemoicValueAndUnit(logInfo, "BPOS");
          this.bposGuageValue = blockPositionValues[0];
          this.bposGuageUnit = blockPositionValues[1];
          this.columnChartsConfig[0].chartValue = `${this.bposGuageValue}${this.bposGuageUnit}`;
          this.columnChartsConfig[0].chartLabel = this.bposGuageLabel;
          this.columnChartsConfig = [...this.columnChartsConfig];
        });
      });
  
      this.isUpdateGuageRunning = false;
    }
  }
  

  
