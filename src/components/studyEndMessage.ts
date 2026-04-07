import { ParticipantData } from '../storage/types';

export const CONSENT_DECLINED_MESSAGE = 'You have declined to participate in this study. Thank you for your time. You may now close this window.';

export function getStudyEndMessage(
  answers: ParticipantData['answers'],
  studyEndMsg: string | undefined,
  participantId: string,
  urlParticipantIdParam?: string,
) {
  const consentAnswer = Object.values(answers).find(
    (answer) => answer.componentName === 'consent',
  )?.answer?.['consent-agree'];

  if (consentAnswer === 'No') {
    return CONSENT_DECLINED_MESSAGE;
  }

  if (!urlParticipantIdParam || !studyEndMsg?.includes('{PARTICIPANT_ID}')) {
    return studyEndMsg;
  }

  return studyEndMsg.replace(/\{PARTICIPANT_ID\}/g, () => participantId);
}
