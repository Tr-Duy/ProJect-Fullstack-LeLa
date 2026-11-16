/** Decode bytes before framing events, preserving whitespace and split UTF-8 characters. */
export class TutorSseParser {
  private decoder = new TextDecoder('utf-8', { fatal: true });
  private buffer = '';
  private data: string[] = [];
  private event = 'message';
  private receive: (event: string, data: string) => void;
  constructor(receive: (event: string, data: string) => void) { this.receive = receive; }
  push(bytes: Uint8Array) { this.consume(this.decoder.decode(bytes, { stream: true }), false); }
  finish() { this.consume(this.decoder.decode(), true); }
  private dispatch() {
    if (this.data.length) this.receive(this.event, this.data.join('\n'));
    this.data = []; this.event = 'message';
  }
  private line(line: string) {
    if (!line) { this.dispatch(); return; }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') this.event = value;
    if (field === 'data') this.data.push(value);
  }
  private consume(text: string, end: boolean) {
    this.buffer += text;
    let start = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const c = this.buffer[i];
      if (c !== '\n' && c !== '\r') continue;
      if (c === '\r' && i === this.buffer.length - 1 && !end) break;
      this.line(this.buffer.slice(start, i));
      if (c === '\r' && this.buffer[i + 1] === '\n') i++;
      start = i + 1;
    }
    this.buffer = this.buffer.slice(start);
    if (end) { if (this.buffer) this.line(this.buffer); this.buffer = ''; this.dispatch(); }
  }
}
