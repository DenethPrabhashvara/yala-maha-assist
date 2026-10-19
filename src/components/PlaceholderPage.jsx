import { Notice, PageTitle } from './shared.jsx';

export default function PlaceholderPage({ title, subtitle, details, selectedRecord, selectedRecordName, selectedRecordType }) {
  return (
    <>
      <PageTitle title={title} subtitle={subtitle} />
      <section className="card placeholder-card">
        <h2 className="ct">Service is Not Connected</h2>
        <p className="small">{details}</p>
        {selectedRecord && <p className="small">Selected {selectedRecordType}: <b>{selectedRecordName}</b>. This page stays open when the selection changes.</p>}
        <Notice> placeholder</Notice>
      </section>
    </>
  );
}
