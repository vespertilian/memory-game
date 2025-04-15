import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './header/header.component';
import { GameComponent } from './game/game.component';
import { CardComponent } from './card/card.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { PlayerDetailsComponent } from './player-details/player-details.component';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';

@NgModule({ declarations: [
        AppComponent,
        HomeComponent,
        HeaderComponent,
        GameComponent,
        CardComponent,
        PlayerDetailsComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        CommonModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatGridListModule,
        MatButtonModule,
        MatProgressBarModule], providers: [
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {}
