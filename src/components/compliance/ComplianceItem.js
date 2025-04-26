"use client";

export default function ComplianceItem({ item, onEdit, onDelete, onView }) {

  const issueDate = item.issue_date ? new Date(item.issue_date).toLocaleDateString() : 'N/A';
  const expirationDate = item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A';

  return (
    <tr key={`compliance-item-${item.id}`} className="border-b border-gray-200">
      <td className="px-6 py-4">
        <a
          onClick={() => onView(item)}
          className="text-blue-600 hover:underline"
          style={{ cursor: 'pointer' }}
        >
          {item.title}
        </a>
      </td>

      <td className="px-6 py-4">{item.entity_name}</td>
      
      <td className="px-6 py-4">{issueDate}</td>
      
      <td className="px-6 py-4">{expirationDate}</td>

      <td className="px-6 py-4">{item.status}</td>

      <td className="px-6 py-4 text-center">
        <div className="flex justify-center">
          <button onClick={() => onView(item)} className="btn btn-secondary btn-xs mr-2">
            View
          </button>

          <button onClick={() => onEdit(item)} className="btn btn-primary btn-xs mr-2">
            Edit
          </button>

          <button onClick={() => onDelete(item)} className="btn btn-danger btn-xs">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}