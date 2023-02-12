const field2Info: any = {
  sci(s: string) {
    let rank;
    let key = "SCI", value = s;
    if (s == "Q1") {
      rank = 1
    } else if (s == "Q2") {
      rank = 2
    } else if (s == "Q3") {
      rank = 3
    } else if (s == "Q4") {
      rank = 4
    }
    return { rank, key, value}
  },
  sciif(s: string) {
    let key = "SCIIF", value = s;
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
    return {rank, key, value}
  },
  sciif5(s: string) {
    let number = parseFloat(s);
    let key = "SCIIF(5)", value = s;
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
    return { rank, key, value }
  },
  sciBase(s: string) {
    let key = "SCI基础版", value = s;
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
    return { rank, key, value }
  },
  sciUp(s: string) {
    let key = "SCI升级版", value = s;
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
    return {rank, key, value}
  },
  ssci(s: string) {
    let key = "SSCI", value = s
    let rank
    if (s == "Q1") {
      rank = 1
    } else if (s == "Q2") {
      rank = 2
    } else if (s == "Q3") {
      rank = 3
    } else if (s == "Q4") {
      rank = 4
    } else if (s == "SSCI") {
      rank = 5
    }
    return {rank, key, value}
  },
  eii(s: string) {
    let key = "EI检索", value = "";
    let rank = 2
    return { rank, key, value: ""}
  },
  cssci(s: string) {
    let key = s, value = "";
    let rank
    if (s == "CSSCI") {
      rank = 1
    } else if (s == "CSSCI扩展版") {
      rank = 2
    }
    return {rank, key, value}
  },
  nju(s: string) {
    let key = "NJU", value = s;
    let rank
    if (s == "超一流期刊" || s == "学科群一流期刊") {
      rank = 1
    } else if (s == "A") {
      rank = 2
    } else if (s == "B") {
      rank = 3
    }
    return {rank, key, value}
  },
  pku(s: string) {
    let key = "北大中文核心", value = ""
    let rank = 1
    return { rank, key, value }
  },
  xju(s: string) {
    let key = "XJU", value = s;
    let rank
    if (s == "一区") {
      rank = 1
    } else if (s == "二区") {
      rank = 2
    } else if (s == "三区") {
      rank = 3
    } else if (s == "四区") {
      rank = 4
    } else if (s == "五区") {
      rank = 5
    } 
    return {rank, key, value}
  },
  ccf(s: string) {
    let key = "CCF", value=s
    let rank
    if (s == "A") {
      rank = 1;
    } else if (s == "B") {
      rank = 2;
    } else if (s == "C") {
      rank = 3;
    } else if (s == "T1") {
      rank = 1;
    } else if (s == "T2") {
      rank = 2;
    } else if (s == "T3") {
      rank = 3;
    }
    return {rank, key, value}
  }
}

export default field2Info