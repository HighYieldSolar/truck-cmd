import React, { useState, useEffect } from 'react';
import { createCustomer, updateCustomer } from '../../lib/services/customerService';

const CustomerFormModal = ({ isOpen, onClose, userId, existingCustomer }) => {
  const [customer, setCustomer] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    customer_type: 'Shipper',
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    if (existingCustomer) {
      setCustomer(existingCustomer);
    }
  }, [existingCustomer]);

  const handleChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingCustomer) {
      await updateCustomer(existingCustomer.id, customer);
    } else {
      await createCustomer(userId, customer);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{existingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="company_name" placeholder="Company Name" value={customer.company_name} onChange={handleChange} required />
          <input type="text" name="contact_name" placeholder="Contact Name" value={customer.contact_name} onChange={handleChange} />
          <input type="email" name="email" placeholder="Email" value={customer.email} onChange={handleChange} />
          <input type="text" name="phone" placeholder="Phone" value={customer.phone} onChange={handleChange} />
          <input type="text" name="address" placeholder="Address" value={customer.address} onChange={handleChange} />
          <input type="text" name="city" placeholder="City" value={customer.city} onChange={handleChange} />
          <input type="text" name="state" placeholder="State" value={customer.state} onChange={handleChange} />
          <input type="text" name="zip" placeholder="Zip Code" value={customer.zip} onChange={handleChange} />
          <select name="customer_type" value={customer.customer_type} onChange={handleChange}>
            <option value="Shipper">Shipper</option>
            <option value="Consignee">Consignee</option>
            <option value="Broker">Broker</option>
          </select>
          <select name="status" value={customer.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <textarea name="notes" placeholder="Notes" value={customer.notes} onChange={handleChange}></textarea>
          <button type="submit">{existingCustomer ? 'Update' : 'Create'}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
