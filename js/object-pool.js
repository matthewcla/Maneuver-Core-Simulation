/**
 * Simple object pool to reduce GC pressure for radar objects.
 * @template T
 */
export class ObjectPool {
  constructor(createFn) {
    this.createFn = createFn;
    this.pool = [];
  }
  /**
   * Acquire an object from the pool.
   * @returns {T}
   */
  acquire() {
    return this.pool.pop() || this.createFn();
  }
  /**
   * Release an object back to the pool.
   * @param {T} obj
   */
  release(obj) {
    this.pool.push(obj);
  }
}
