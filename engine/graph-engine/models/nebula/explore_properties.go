package nebula

import (
	"fmt"
	"graph-engine/utils"
	"strings"
)

func GetProperties(conf *utils.KGConf, class string) ([]Property, error) {
	nebula := Nebula{}

	descTag := fmt.Sprintf("desc tag `%s`", class)
	resultSet, err := nebula.Client(conf, descTag)
	if err != nil {
		return nil, err
	}

	var properties []Property

	for i := 0; i < resultSet.GetRowSize(); i++ {
		rowValue, _ := resultSet.GetRowValuesByIndex(i)
		rowValueSplit := strings.Split(rowValue.String(), ", ")

		properties = append(properties, Property{
			Name:        utils.TrimQuotationMarks(rowValueSplit[0]),
			Type:        utils.TrimQuotationMarks(rowValueSplit[1]),
			LinkedClass: "",
			Mandatory:   false,
		})
	}

	return properties, nil
}
