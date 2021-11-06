const mutationBuffer: Partial<MutationRecord>[] = [];

const readMutationBuffer = () => {
  const buffer = [...mutationBuffer];
  mutationBuffer.length = 0;
  return buffer;
};

(() => {
  const serializeMut = (mutationArr : MutationRecord[]) => {
    console.log(mutationArr);
    return mutationArr
      .filter((x) => x.type === 'attributes')
      .map((mut) => ({
        type: mut.type,
        selector: (<any>window).SelectorGenerator.GetSelectorStructural(mut.target),
        attributeName: mut.attributeName,
        attributeValue: (<HTMLElement>mut.target).getAttribute(<string>mut.attributeName),
      }));
  };
  const observer = new MutationObserver((mut) => mutationBuffer.push(...serializeMut(mut)));
  observer.observe(document, { attributes: true, subtree: true });
})();
