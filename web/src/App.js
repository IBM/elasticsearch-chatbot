import React from 'react';
import { ChatFeed, Message } from 'react-chat-ui';
import {Button, Form, FormGroup, Input, Container, Row, Col} from "reactstrap";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      messages: [
        new Message({
          id: 1,
          message: "Hi! I am Vincent. Ask me questions for information about TV shows or I can make recommendations of TV shows based on what you are interested in.",
          senderName: "Vincent"
        })],
      input: "",
      sessionId: ""
    };

    this.startSession();
  }

  startSession = async (e) => {
    if(e) e.preventDefault();

    const response = await fetch(API_BASE_URL+'/api/v1/chat/session');

    var chatbotResponse = await response.json();

    this.setState({sessionId: chatbotResponse["sessionId"]});
  }

  send = async (e) => {
    if(e) e.preventDefault();

    if (this.state.input.replace(/\s+/g,'').length > 0) {

      var addUserMessage = this.state.messages;

      var userMessage = this.state.input;

      addUserMessage.push(new Message({
        id: 0,
        message: userMessage
      }));

      this.setState({messages: addUserMessage,
                    input: ""});

      var chat = document.getElementById("chat");
      chat.scrollTop = chat.scrollHeight;
        
      var response = await fetch(API_BASE_URL+'/api/v1/chat',{
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({message: userMessage, sessionId: this.state.sessionId})
      });

      var chatbotResponse = await response.json();

      if (chatbotResponse) {
        if (chatbotResponse["error"]) {
          await this.startSession();

          response = await fetch(API_BASE_URL+'/api/v1/chat',{
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({message: userMessage, sessionId: this.state.sessionId})
          });

          chatbotResponse = await response.json();
        }

        if (chatbotResponse) {
          var addBotMessage = this.state.messages;

          addBotMessage.push(new Message({
            id: 1,
            message: chatbotResponse["generic"],
            senderName: "Vincent"
          }));

          if (chatbotResponse["data"]) {

            var chatbotResponseParts = chatbotResponse["data"].split("\n");

            for (var part = 0; part < chatbotResponseParts.length; part++) {
              addBotMessage.push(new Message({
                id: 1,
                message: chatbotResponseParts[part],
                senderName: "Vincent"
              }));
            }
          }
          
          this.setState({messages: addBotMessage});

          chat.scrollTop = chat.scrollHeight;
        }
      }
    }
  }

  render() {
    return (
        <Container>
          <Row>
            <Col lg={{offset: 4 }}>
              <h1>TV Show Chatbot</h1>
            </Col>
          </Row>
          <Row>
            <Col style={{overflowX : 'auto', height: (window.innerHeight/4)*3 + 'px'}} id="chat">
              <ChatFeed
              messages={this.state.messages} // Boolean: list of message objects
              isTyping={this.state.is_typing} // Boolean: is the recipient typing
              hasInputField={false} // Boolean: use our input, or use your own
              showSenderName // show the name of the user who sent the message
              bubblesCentered={false} //Boolean should the bubbles be centered in the feed?
              // JSON: Custom bubble styles
              bubbleStyles={
                {
                  text: {
                    fontSize: 20,
                    color: '#000000'
                  },
                  chatbubble: {
                    borderRadius: 35,
                    padding: 20
                  }
                }
              }
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Form onSubmit={this.send}>
              <Row>
                <Col>
                  <FormGroup>
                    <Input type="text" value={this.state.input} onChange={e => this.setState({input: e.target.value})}/>
                  </FormGroup>
                </Col>
                <Col xs="auto">
                  <Button type="submit" color="primary" className="float-right">Send</Button>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>
    );
  }
};

export default App;
