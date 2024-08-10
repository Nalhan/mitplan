import React from 'react';
import TimelineEvent from './TimelineEvent';

class MitplanEvent {
  constructor(key, timestamp, columnId) {
    this.key = key;
    this.timestamp = timestamp;
    this.columnId = columnId;
  }

  render(props) {
    return <TimelineEvent {...props} event={this} />;
  }
}

class CooldownEvent extends MitplanEvent {
  constructor(key, timestamp, columnId, duration) {
    super(key, timestamp, columnId);
    this.duration = duration;
    this.type = 'cooldown';
  }

  render(props) {
    return <TimelineEvent {...props} event={this} duration={this.duration} />;
  }
}

class TextEvent extends MitplanEvent {
  constructor(key, timestamp, columnId, text) {
    super(key, timestamp, columnId);
    this.text = text;
    this.type = 'text';
  }

  render(props) {
    return <TimelineEvent {...props} event={this} text={this.text} />;
  }
}

class MarkupEvent extends MitplanEvent {
  constructor(key, timestamp, columnId, markup) {
    super(key, timestamp, columnId);
    this.markup = markup;
    this.type = 'markup';
  }

  render(props) {
    return <TimelineEvent {...props} event={this} markup={this.markup} />;
  }
}

export { MitplanEvent, CooldownEvent, TextEvent, MarkupEvent };
