const field2Info: any = {
  sci(s: string) {
    let rank;
    let text = `SCI ${s}`
    if (s == "Q1") {
      rank = 1
    } else if (s == "Q2") {
      rank = 2
    } else if (s == "Q3") {
      rank = 3
    } else if (s == "Q4") {
      rank = 4
    }
    return {rank, text}

  },
  sciif(s: string) {
    let text = `SCIIF ${s}`
    let number = Number(s);
    let rank
    if (number >= 10) {
      rank = 1
    } else if (number >= 4 && number < 10) {
      rank = 2
    } else if (number >= 2 && number < 4) {
      rank = 3
    } else if (number >= 1 && number < 2) {
      rank = 4
    } else if (number >= 0 && number < 1) {
      rank = 5
    }
    return {rank, text}
  },
  sciif5(s: string) {
    let number = parseFloat(s);
    let text = `SCIIF(5) ${s}`
    let rank
    if (number >= 10) {
      rank = 1
    } else if (number >= 4 && number < 10) {
      rank = 2
    } else if (number >= 2 && number < 4) {
      rank = 3
    } else if (number >= 1 && number < 2) {
      rank = 4
    } else if (number >= 0 && number < 1) {
      rank = 5
    }
    return {rank, text}
  },
  sciBase(s: string) {
    let text = `SCI基础版 ${s}`
    s = s.substring(s.length - 2);
    let rank
    if (s == "1区") {
      rank = 1
    } else if (s == "2区") {
      rank = 2
    } else if (s == "3区") {
      rank = 3
    } else if (s == "4区") {
      rank = 4
    }
    return {rank, text}
  },
  sciUp(s: string) {
    let text = `SCI升级版 ${s}`
    s = s.substring(s.length - 2);
    let rank
    if (s == "1区") {
      rank = 1
    } else if (s == "2区") {
      rank = 2
    } else if (s == "3区") {
      rank = 3
    } else if (s == "4区") {
      rank = 4
    }
    return {rank, text}
  },
  ssci(s: string) {
    let text = `SSCI ${s}`
    let rank
    if (s == "SSCI Q1") {
      rank = 1
    } else if (rank == "SSCI Q2") {
      rank = 2
    } else if (rank == "SSCI Q3") {
      rank = 3
    } else if (rank == "SSCI Q4") {
      rank = 4
    } else if (rank == "SSCI SSCI") {
      rank = 5
      text = "SSCI";
    }
    return {rank, text}
  },
  eii(s: string) {
    let text = "EI检索"
    let rank = 2
    return {rank, text}
  },
  nju(s: string) {
    let text = `NJU ${s}`
    let rank
    if (s == "超一流期刊" || s == "学科群一流期刊") {
      rank = 1
    } else if (rank == "A") {
      rank = 2
    } else if (rank == "B") {
      rank = 3
    }
    return {rank, text}
  },
  pku(s: string) {
    let text = "北大中文核心"
    let rank = 1
    return { rank, text }
  }
}

export default field2Info