/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  set numGuests(val) {
    if (val < 1) throw new Error("Cannot have less than 1 guest")
    this._numGuests = val;
  }

  get numGuests() {
    return this._numGuests;
  }

  set startAt(val) {
    if (val instanceof Date && !isNaN(val)) this._startAt = val
    else throw new Error("Not a true startAt")
  }

  get startAt() {
    return this._startAt;
  }

  get formattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  set notes(val) {
    this._notes = val || "";
  }

  get notes() {
    return this._notes
  }

  set customerId(val) {
    if (this._customerId && this._customerId !== val)
    throw new Error("Cannot change customer's ID")
    this._customerId = val;
  }

  get customerId() {
    return this._customerId;
  }

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
           customer_id AS "customerId",
           num_guests AS "numGuests",
           start_at AS "startAt",
           notes AS "notes"
         FROM reservations
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }
  static async get(id) {
    const result = await db.query(
      `SELECT id,
           customer_id AS "customerId",
           num_guests AS "numGuests",
           start_at AS "startAt",
           notes
         FROM reservations
         WHERE id = $1`,
      [id]
    );

    let reservation = results.row[0];

    if (reservation === undefined) {
      const err = new Error(`No such reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }

  /** given a customer id, find their reservations. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET customer_id=$1, start_at=$2, num_guests=$3, notes=$4
             WHERE id=$5`,
        [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
