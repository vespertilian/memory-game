import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {

  form = new FormGroup({
    player1Name: new FormControl('', Validators.required),
    player2Name: new FormControl('')
  })

  get player1Name(): string {
    return this.form.get('player1Name')?.value || 'No name set'
  }

  get player2Name(): string {
    return this.form.get('player2Name')?.value || 'No name set'
  }

  constructor(private router: Router) {}

  twoPlayerDisabled(form: FormGroup): boolean {
    if (!form.valid) {
      return true
    }
    if (!form.get('player2Name')?.value) {
      return true
    }
    return false
  }


  start1PlayerGame() {
    this.router.navigate(['game'], {queryParams: {
        player1Name: this.player1Name,
        players: 1
      }
    })
  }

  start2PlayerGame() {
    this.router.navigate(['game'], {queryParams: {
        player1Name: this.player1Name,
        player2Name: this.player2Name,
        players: 2
      }
    })
  }
}
