import { Component, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';  
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-landing',
    standalone: true, 
    imports: [RouterOutlet, MatFormFieldModule,
      MatToolbarModule, MatSidenavModule, MatIconModule, 
      MatListModule, MatButtonModule, RouterModule,FlexLayoutModule,MatTabsModule],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css'
})
export class LandingComponent {

  selectedCard = signal<any | null>(null);
  isLoading = signal(false);
  generatedContent = signal<string | null>(null);

  planSummaryInput = '';
  drillingParametersInput = '';
  menuItems: any[] =[
    {
      icon:'home',
      label:'Home',
      route:'home'
    },
    {
      icon:'handshake',
      label:'Partners',
      route:'partners'
    },
    {
      icon:'book',
      label:'Training',
      route:'training'
    },
    {
      icon:'event',
      label:'Events',
      route:'event'
    },
    {
      icon:'help',
      label:'Support',
      route:'support'
    },
    {
      icon:'help',
      label:'recent',
      route:'recent'
    },
    {
      icon:'help',
      label:'all',
      route:'all'
    },
    {
      icon:'help',
      label:'registration',
      route:'registration'
    },

    

  ];

  mainMenuItems = [
    { label: 'iPlanning', icon: 'event' },
    { label: 'iEngineering', icon: 'engineering' },
    { label: 'iOperations', icon: 'build_circle' },
    { label: 'iAnalytics', icon: 'analytics' },
    { label: 'Support Center', icon: 'support' },
    { label: 'My Access', icon: 'lock_open' }
  ];

  subHeaderTabs = [
    { label: 'Scheduling & Budgeting', icon: 'insert_chart_outlined', active: true },
    { label: 'Wellsite & Water Supply System', icon: 'water_drop' },
    { label: 'Service Assignment', icon: 'assignment' },
    { label: 'Rig Library', icon: 'grid_view' },
    { label: 'Division Assignment', icon: 'apartment' },
    { label: 'Santization', icon: 'cleaning_services' },
    { label: 'RTVA', icon: 'analytics' },
    { label: 'New Rig Library', icon: 'grid_view' },
    { label: 'Rig Procurement', icon: 'construction' }
  ];

  cards = signal([
    { id: 'cost-review', title: 'Cost Review Workflow', icon: 'attach_money', colorClass: 'text-gray-600', active: false },
    { id: 'drilling-schedule', title: 'Drilling Schedule', icon: 'calendar_today', colorClass: 'text-gray-600', active: false },
    { id: 'platform-editor', title: 'Platform Editor', icon: 'edit', colorClass: 'text-gray-600', active: false },
    { id: 'scheduling-change', title: 'Scheduling Change Request', icon: 'pending_actions', colorClass: 'text-[#54e4e9]', active: true },
    { id: 'target-days', title: 'Target Days System', icon: 'my_location', colorClass: 'text-gray-600', active: false },
    { id: 'plan-summary', title: 'AI Business Plan Summary ✨', icon: 'auto_awesome', colorClass: 'text-yellow-600', active: false, geminiTitle: 'AI Business Plan Summary' },
    { id: 'drilling-optimization', title: 'AI Drilling Optimization ✨', icon: 'auto_awesome', colorClass: 'text-blue-600', active: false, geminiTitle: 'AI Drilling Optimization Report' }
  ]);

  selectCard(card: any) {
    this.selectedCard.set(card);
    this.generatedContent.set(null);
    this.planSummaryInput = '';
    this.drillingParametersInput = '';
  }

  async callGeminiApi(prompt: string): Promise<string> {
    const systemPrompt = `You are an expert in oil and gas operations and engineering. Provide detailed, well-structured professional responses in markdown format. Use headings, bullet points, and bold text for readability.`;
    const userQuery = prompt;
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    let retryDelay = 1000;
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const candidate = result?.candidates?.[0];
                return candidate?.content?.parts?.[0]?.text || 'No response generated.';
            } else if (response.status === 429) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2;
            } else {
                return `Error: ${response.status} ${response.statusText}`;
            }
        } catch (error: any) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 2;
            if (retries >= maxRetries) {
                return `An error occurred: ${error.message}`;
            }
        }
    }
    return `Failed to fetch after ${maxRetries} retries.`;
  }

  async generatePlanSummary() {
    if (!this.planSummaryInput.trim()) return;

    this.isLoading.set(true);
    const fullPrompt = `Generate a comprehensive business plan report based on the following summary: ${this.planSummaryInput}`;
    const response = await this.callGeminiApi(fullPrompt);
    this.generatedContent.set(response);
    this.isLoading.set(false);
  }

  async generateDrillingReport() {
    if (!this.drillingParametersInput.trim()) return;

    this.isLoading.set(true);
    const fullPrompt = `Create a detailed drilling optimization report based on these parameters: ${this.drillingParametersInput}`;
    const response = await this.callGeminiApi(fullPrompt);
    this.generatedContent.set(response);
    this.isLoading.set(false);
  }
}
