'use strict';

function Node(data) {
  this.data = data;
  // next
  // prev
}

/**
* Linked list.
*/
function LinkedList(initData) {
  this.length = 0;
    // this.head = undefined;
    // this.tail = undefined;
  if (initData) {
    this.add(initData);
  }
}
LinkedList.prototype.isEmpty = function isEmpty() {
  return !this.head;
};
LinkedList.prototype.forEach = function forEach(fn) {
  if (this.isEmpty()) {
    return;
  }
  let i = 0;
  let cur = this.head;
  while (cur) {
    fn(cur.data, i++);
    cur = cur.next;
  }
};
LinkedList.prototype.pop = function pop() {
  if (!this.head) {
    return undefined;
  }
  this.length--;
  const retVal = this.head.data;
  this.head = this.head.next;
  if (this.head) {
    delete this.head.prev;
  }
  return retVal;
};
LinkedList.prototype.add = function add(data) {
  if (data === undefined) {
    throw new Error('Cannot insert undefined into linked list');
  }
  if (!this.head) {
    this.head = this.tail = new Node(data);
  } else {
    const prevTail = this.tail;
    this.tail = this.tail.next = new Node(data);
    this.tail.prev = prevTail;
  }
  const tail = this.tail;
  tail.remove = () => {
    if (tail.prev) {
      tail.prev.next = tail.next;
    }
    if (tail.next) {
      tail.next.prev = tail.prev;
    }
    return tail.data;
  };
  this.length++;
  return tail;
};
module.exports = LinkedList;
