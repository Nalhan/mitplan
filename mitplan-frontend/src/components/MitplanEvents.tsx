import React from 'react';
import TimelineEvent from './TimelineEvent';

interface MitplanEventProps {
  key: string;
  timestamp: number;
  columnId: number;
}

class MitplanEvent {
  key: string;
  timestamp: number;
  columnId: number;

  constructor(key: string, timestamp: number, columnId: number) {
    this.key = key;
    this.timestamp = timestamp;
    this.columnId = columnId;
  }

  render(props: any) {
    return <TimelineEvent {...props} event={this} />;
  }
}

interface CooldownEventProps extends MitplanEventProps {
  duration: number;
}

class CooldownEvent extends MitplanEvent {
  duration: number;
  type: string;

  constructor({ key, timestamp, columnId, duration }: CooldownEventProps) {
    super(key, timestamp, columnId);
    this.duration = duration;
    this.type = 'cooldown';
  }

  render(props: any) {
    return <TimelineEvent {...props} event={this} duration={this.duration} />;
  }
}

interface TextEventProps extends MitplanEventProps {
  text: string;
}

class TextEvent extends MitplanEvent {
  text: string;
  type: string;

  constructor({ key, timestamp, columnId, text }: TextEventProps) {
    super(key, timestamp, columnId);
    this.text = text;
    this.type = 'text';
  }

  render(props: any) {
    return <TimelineEvent {...props} event={this} text={this.text} />;
  }
}

interface MarkupEventProps extends MitplanEventProps {
  markup: string;
}

class MarkupEvent extends MitplanEvent {
  markup: string;
  type: string;

  constructor({ key, timestamp, columnId, markup }: MarkupEventProps) {
    super(key, timestamp, columnId);
    this.markup = markup;
    this.type = 'markup';
  }

  render(props: any) {
    return <TimelineEvent {...props} event={this} markup={this.markup} />;
  }
}

export { MitplanEvent, CooldownEvent, TextEvent, MarkupEvent };