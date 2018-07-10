import React, { Component } from 'react';
import { subscribeToTimer } from './app';

class Room extends Component {
    constructor(props) {
        super(props)
        subscribeToTimer((err, timestamp) => this.setState({
            timestamp
        }));
        this.state = {
            questions: '',
            correct_answers: '',
            wrong_answers: '',
            users: [],
            currentQuestionIndex: 0,
            inputValue: '',
            answers: [],
            timestamp: 'no timestamp yet'
        }
        this.nextQuestion = this.nextQuestion.bind(this)
        this.updateInput = this.updateInput.bind(this)
        this.onFormSubmit = this.onFormSubmit.bind(this)
        this.multipleChoice = this.multipleChoice.bind(this)
    }

    componentDidMount() {
        fetch('/room.json')
            .then(response => response.json())
            .then(json => {
                this.setState({
                    questions: json.results.map(x => {
                        let parser = new DOMParser();
                        let dom = parser.parseFromString(`<!doctype html><body><div>${x.question}</div>`, 'text/html');
                        return (dom.body.textContent);
                    }),
                    correct_answers: json.results.map(y => y.correct_answer),
                    wrong_answers: json.results.map(y => y.incorrect_answers)
                })
                for (let i = 0; i < this.state.wrong_answers.length; i++) {
                    this.setState({
                        answers: this.state.answers.concat([this.state.wrong_answers[i].concat(this.state.correct_answers[i])])
                    })
                }
            })
    }

    onFormSubmit(e) {
        e.preventDefault()
        this.setState({
            users: this.state.users.concat([this.state.inputValue]),
            inputValue: ''
        })
    }

    updateInput(evt) {
        this.setState({ inputValue: evt.target.value })
    }

    nextQuestion() {
        this.setState({
            currentQuestionIndex: this.state.currentQuestionIndex + 1
        })
        if (this.state.currentQuestionIndex >= this.state.questions.length - 1) {
            this.setState({
                currentQuestionIndex: 0
            })
        }
    }
    multipleChoice() {
        let current = this.state.answers[this.state.currentQuestionIndex]
        current.map(x => {
            return (<button>{x}</button>)
        })
    }
    render() {
        if (this.state.users.length >= 1) {
            return (
                <div>
                    <h1>{this.state.questions[this.state.currentQuestionIndex]}</h1>
                    <form>
                        {this.multipleChoice()}
                    </form>
                    <button onClick={this.nextQuestion}>Next Question</button>
                    <p className="App-intro">
                        This is the timer value: {this.state.timestamp}
                    </p>
                </div>
            )
        }
        return (
            <form onSubmit={this.onFormSubmit}>
                <input onChange={evt => this.updateInput(evt)} value={this.state.inputValue} className="users" name='users' placeholder="Enter Username" />
                <input type="submit" />
            </form>
        );
    }
}

export default Room;