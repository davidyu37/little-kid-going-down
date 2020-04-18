class connectionHistory {
  constructor(from, to, inno, innovationNos) {
    this.fromNode = from;
    this.toNode = to;
    this.innovationNumber = inno;
    this.innovationNumbers = [];
    arrayCopy(innovationNos, this.innovationNumbers); //copy (from, to)
  }

  matches(genome, from, to) {
    if (genome.genes.length === this.innovationNumbers.length) {
      //if the number of connections are different then the genoemes aren't the same
      if (from.number === this.fromNode && to.number === this.toNode) {
        //next check if all the innovation numbers match from the genome
        for (var i = 0; i < genome.genes.length; i++) {
          if (!this.innovationNumbers.includes(genome.genes[i].innovationNo)) {
            return false;
          }
        }
        //if reached this far then the innovationNumbers match the genes innovation numbers and the connection is between the same nodes
        //so it does match
        return true;
      }
    }
    return false;
  }
}

function arrayCopy(src, srcPosition, dst, dstPosition, length) {
  // the index to begin splicing from dst array
  let start;
  let end;

  if (typeof length !== "undefined") {
    end = Math.min(length, src.length);
    start = dstPosition;
    src = src.slice(srcPosition, end + srcPosition);
  } else {
    if (typeof dst !== "undefined") {
      // src, dst, length
      // rename  so we don't get confused
      end = dst;
      end = Math.min(end, src.length);
    } else {
      // src, dst
      end = src.length;
    }

    start = 0;
    // rename  so we don't get confused
    dst = srcPosition;
    src = src.slice(0, end);
  }
}
