# Jekyll 3 / Liquid 4 still call taint APIs that were removed in Ruby 3.2+.
# This shim keeps local builds working on newer Ruby versions.
class Object
  unless method_defined?(:tainted?)
    def tainted?
      false
    end
  end

  unless method_defined?(:untaint)
    def untaint
      self
    end
  end
end
