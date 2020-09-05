export const sleep = (hasFunc: () => void, timeOnMillseconds: number) => {
  return new Promise((resolve, reject) => {
    if (timeOnMillseconds > 0)
      setTimeout(() => resolve(hasFunc), timeOnMillseconds);
    reject();
  });
};
