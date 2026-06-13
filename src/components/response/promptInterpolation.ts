import { ParticipantData } from '../../storage/types';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAnswerValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function findAnswerValue(
  answers: ParticipantData['answers'],
  componentName: string,
  responseId: string,
) {
  const answerEntry = Object.values(answers).find(
    (answer) => answer.componentName === componentName
      && Object.hasOwn(answer.answer || {}, responseId),
  );

  return answerEntry?.answer?.[responseId];
}

export function interpolateAnswerReferences(
  text: string,
  answers: ParticipantData['answers'],
) {
  return text.replace(/\{answer:([^}|]+)(?:\|([^}]*))?\}/g, (_, reference: string, fallback = '') => {
    const separatorIndex = reference.lastIndexOf('.');

    if (separatorIndex === -1) {
      return fallback;
    }

    const componentName = reference.slice(0, separatorIndex);
    const responseId = reference.slice(separatorIndex + 1);
    const value = formatAnswerValue(findAnswerValue(answers, componentName, responseId)).trim();

    return value.length > 0 ? escapeHtml(value) : fallback;
  });
}
