import React, { useState } from 'react';
import { PhoneContact } from '../types/agent';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  MessageSquare,
  Star,
  Globe,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';

interface ContactsHubProps {
  contacts: PhoneContact[];
  onUpdateContacts: (contacts: PhoneContact[]) => void;
  onOpenWhatsAppWithContact?: (contact: PhoneContact) => void;
  onOpenEmailWithContact?: (contact: PhoneContact) => void;
  onAgentActionLog?: (log: string) => void;
}

export const ContactsHub: React.FC<ContactsHubProps> = ({
  contacts,
  onUpdateContacts,
  onOpenWhatsAppWithContact,
  onOpenEmailWithContact,
  onAgentActionLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<'all' | 'bn' | 'hi' | 'en'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New contact form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRelationship, setNewRelationship] = useState('Friend / Associate');
  const [newLanguage, setNewLanguage] = useState<'bn' | 'hi' | 'en'>('bn');
  const [newNotes, setNewNotes] = useState('');

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang =
      selectedLanguageFilter === 'all' || c.preferredLanguage === selectedLanguageFilter;
    return matchesSearch && matchesLang;
  });

  const handleToggleStar = (id: string) => {
    const updated = contacts.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c));
    onUpdateContacts(updated);
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    onUpdateContacts(updated);
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const colors = [
      'from-cyan-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
    ];

    const newContact: PhoneContact = {
      id: 'contact_' + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      relationship: newRelationship,
      preferredLanguage: newLanguage,
      notes: newNotes.trim() || 'Added via AURA Contact Manager',
      lastContacted: 'Today',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      starred: false,
    };

    onUpdateContacts([newContact, ...contacts]);
    onAgentActionLog?.(`Added contact ${newContact.name} (${newContact.phone})`);

    // Reset & close modal
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col gap-6">
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Phone Contacts Manager</h3>
            <p className="text-xs text-slate-400 font-mono">
              Total {contacts.length} Contacts synced with AI Agent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts / phone..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 md:w-64"
            />
          </div>

          {/* Language filter */}
          <select
            value={selectedLanguageFilter}
            onChange={(e) => setSelectedLanguageFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Languages</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="en">English</option>
          </select>

          {/* Add Contact Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        </div>
      </div>

      {/* Contacts Cards Grid */}
      {filteredContacts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-slate-950/40 rounded-xl border border-slate-800">
          <Users className="w-12 h-12 text-slate-600" />
          <h4 className="text-sm font-semibold text-white">No Contacts Added Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Add contacts to manage phone numbers, trigger WhatsApp messages, and draft emails with MS Agent.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-tr ${contact.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {contact.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {contact.name}
                      {contact.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                    </h4>
                    <span className="text-[11px] text-purple-400 font-mono">{contact.relationship}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStar(contact.id)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star className={`w-3.5 h-3.5 ${contact.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span>
                    Language:{' '}
                    <strong className="text-cyan-400 uppercase">{contact.preferredLanguage}</strong>
                  </span>
                </div>
              </div>

              {contact.notes && (
                <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  "{contact.notes}"
                </p>
              )}

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenWhatsAppWithContact?.(contact)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" /> WhatsApp
                </button>

                <button
                  onClick={() => onOpenEmailWithContact?.(contact)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-blue-950/80 hover:bg-blue-900/90 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-3 h-3" /> Email
                </button>

                <a
                  href={`tel:${contact.phone}`}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors flex items-center justify-center cursor-pointer"
                  title="Direct Phone Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              Add New Phone Contact
            </h4>

            <form onSubmit={handleAddContactSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. শুভঙ্কর দাস / Rohan Patel / Alex"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Phone Number:</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Email Address:</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contact@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Relationship:</label>
                  <select
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                  >
                    <option value="Colleague / Work">Colleague / Work</option>
                    <option value="Client / Business">Client / Business</option>
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="VIP Associate">VIP Associate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Language:</label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                  >
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Notes for AI Agent:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Always respond in formal Bengali; preferred call time 4 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
