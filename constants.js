const isSandbox = true
const token = (isSandbox
  ? 'EAAAEITQ1nG4hqFBGno_k3sh9mlzr37MZ65uWrmyq0xLqOfrAQy6ND_KiULIVAvW'
  : 'TODO')
const squareVersion = '2022-01-20'
const url = (isSandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com')
const locationId = (isSandbox ? 'LY98K9RV5T514' : 'LJ64PB3KA6SZS')
const membershipTypes = (isSandbox 
  ? //sandbox
    { 
      "Single/Senior": "J6SK2GYKI4P3AAG6OGTG5WWS",
      "Family": "AJ6RVLZXQ6XZANQ2MNQNQCYK",
      "Sustain": "767TDW2GBRZGWYNJ2LX7HTHA",
      "Lifetime": "N7QTTGHSFD52TGACZEMGBJEF",
      "Non-Resident": "P2OUGHIUHQX2SLV4ITU33BNZ"
    }
  : // production
    { 
      "Single/Senior": "LR4BQG4QMRVRGAZS2WQ5YU45",
      "Family": "MKBLJ644IG433CV5LKYUR2PO",
      "Sustain": "JBOUAAP7X5PMY6PVVTWZR3GK",
      "Lifetime": "FJRKXHWXRWQ3YOJN7XGSAJ2J",
      "Non-Resident": "R3SB5J63IC5R2PLDVVHUYD67"
    }
)

module.exports = {
  token,
  squareVersion,
  url,
  membershipTypes,
  locationId
}