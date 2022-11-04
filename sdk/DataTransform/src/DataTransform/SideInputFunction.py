class SideInputFunction(object):

    def create_accumulator(self, *args, **kwargs):
        """Return a fresh, empty accumulator for the combine operation.

        Args:
          *args: Additional arguments and side inputs.
          **kwargs: Additional arguments and side inputs.
        """
        raise NotImplementedError(str(self))

    def add_input(self, mutable_accumulator, element, *args, **kwargs):
        """Return result of folding element into accumulator.

        Args:
          mutable_accumulator: the current accumulator,
            may be modified and returned for efficiency
          element: the element to add, should not be mutated
          *args: Additional arguments and side inputs.
          **kwargs: Additional arguments and side inputs.
        """
        raise NotImplementedError(str(self))

    def add_inputs(self, mutable_accumulator, dataset, *args, **kwargs):
        """Returns the result of folding each element in elements into accumulator.

        This is provided in case the implementation affords more efficient
        bulk addition of elements. The default implementation simply loops
        over the inputs invoking add_input for each one.

        Args:
          mutable_accumulator: the current accumulator,
            may be modified and returned for efficiency
          dataset: the dataset to add, should not be mutated
          *args: Additional arguments and side inputs.
          **kwargs: Additional arguments and side inputs.
        """
        if isinstance(dataset, dict):
            for k in dataset:
                for element in dataset[k]:
                    mutable_accumulator = \
                        self.add_input(mutable_accumulator, element, *args, **kwargs)
        else:
            for element in dataset:
                mutable_accumulator = \
                    self.add_input(mutable_accumulator, element, *args, **kwargs)
        return mutable_accumulator

    def merge_accumulators(self, accumulators, *args, **kwargs):
        """Returns the result of merging several accumulators
        to a single accumulator value.

        Args:
          accumulators: the accumulators to merge.
            Only the first accumulator may be modified and returned for efficiency;
            the other accumulators should not be mutated, because they may be
            shared with other code and mutating them could lead to incorrect
            results or data corruption.
          *args: Additional arguments and side inputs.
          **kwargs: Additional arguments and side inputs.
        """
        raise NotImplementedError(str(self))

    def extract_output(self, accumulator, *args, **kwargs):
        """Return result of converting accumulator into the output value.

        Args:
          accumulator: the final accumulator value computed by this CombineFn
            for the entire input key or PCollection. Can be modified for
            efficiency.
          *args: Additional arguments and side inputs.
          **kwargs: Additional arguments and side inputs.
        """
        raise NotImplementedError(str(self))

    def apply(self, dataset, *args, **kwargs):
        """Returns result of applying this SideInputFunction of dataset.

        Args:
          elements: the set of values to combine.
          *args: Additional arguments and side inputs.
          **kwargs: Additional arguments and side inputs.
        """
        return self.extract_output(
            self.add_inputs(
                self.create_accumulator(*args, **kwargs), dataset, *args,
                **kwargs),
            *args,
            **kwargs)
