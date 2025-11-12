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

  
  